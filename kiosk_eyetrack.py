import cv2
import numpy as np
import time
import serial
import glob
from collections import deque
from flask import Flask, Response, jsonify, request, make_response

app = Flask(__name__)

# Arduino serial link
arduino = None
arduino_ports = glob.glob('/dev/ttyACM*') + glob.glob('/dev/ttyUSB*')
if arduino_ports:
    try:
        arduino = serial.Serial(arduino_ports[0], 115200, timeout=0.02)
        print(f"[SERIAL] Connected to Arduino on {arduino_ports[0]}")
    except Exception as e:
        print(f"[SERIAL] Error opening Arduino: {e}")

eye_cascade = cv2.CascadeClassifier('haarcascade_eye.xml')

# Open camera with ZERO frame buffer (eliminates 130ms V4L2 queue delay)
cap = cv2.VideoCapture(0, cv2.CAP_V4L2)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)

iris_history = deque(maxlen=30)
prev_gx, prev_gy = 0.5, 0.5
last_valid_gx, last_valid_gy = 0.5, 0.5
prev_time = time.monotonic()
saccade_count = 0
saccadic_intrusions = 0
last_saccade_time = 0
is_blinking = False
blink_cooldown_frames = 0
smooth_gx, smooth_gy = 0.5, 0.5

# ==========================================
# CALIBRATOR & ZERO-DELAY ENGINE
# ==========================================
class FastEyeCalibrator:
    def __init__(self):
        self.min_x = 0.36
        self.max_x = 0.64
        self.min_y = 0.41
        self.max_y = 0.54
        self.gain_x = 3.6
        self.gain_y = 8.5

    def set_bounds(self, min_x, max_x, min_y, max_y):
        self.min_x = max(0.15, min_x)
        self.max_x = min(0.85, max_x)
        self.min_y = max(0.20, min_y)
        self.max_y = min(0.80, max_y)
        print(f"[CALIBRATION] Custom bounds updated: X=[{self.min_x:.2f}, {self.max_x:.2f}], Y=[{self.min_y:.2f}, {self.max_y:.2f}]")

    def normalize(self, rx, ry):
        rx = 1.0 - rx # Mirror horizontal

        # Adaptive auto-tune
        if rx < self.min_x: self.min_x = max(0.15, self.min_x - 0.001)
        if rx > self.max_x: self.max_x = min(0.85, self.max_x + 0.001)
        if ry < self.min_y: self.min_y = max(0.20, self.min_y - 0.001)
        if ry > self.max_y: self.max_y = min(0.80, self.max_y + 0.001)

        range_x = max(self.max_x - self.min_x, 0.12)
        range_y = max(self.max_y - self.min_y, 0.05)

        norm_x = (rx - self.min_x) / range_x
        norm_y = (ry - self.min_y) / range_y

        return np.clip(norm_x, 0.05, 0.95), np.clip(norm_y, 0.05, 0.95)

calibrator = FastEyeCalibrator()

latest_telemetry = {
    "timestampMs": 0, "gazeX": 0.5, "gazeY": 0.5,
    "saccadeDetected": False, "isBlinking": False,
    "saccadicIntrusions": 0, "velocity": 0.0
}

def process_frame(frame):
    global prev_gx, prev_gy, prev_time, smooth_gx, smooth_gy
    global saccade_count, saccadic_intrusions, last_saccade_time
    global is_blinking, blink_cooldown_frames, last_valid_gx, last_valid_gy
    global latest_telemetry

    current_time = time.monotonic()
    timestamp_ms = int(current_time * 1000)
    dt = max(current_time - prev_time, 0.001)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Fast 320x240 downscaled detection (4x faster, ~3ms)
    small_gray = cv2.resize(gray, (320, 240))
    eyes = eye_cascade.detectMultiScale(small_gray, scaleFactor=1.2, minNeighbors=4, minSize=(20, 20))

    saccade_detected = False
    velocity = 0.0
    gx, gy = last_valid_gx, last_valid_gy

    if len(eyes) == 0:
        is_blinking = True
        blink_cooldown_frames = 3
    else:
        # Scale eye box back to 640x480
        ex_s, ey_s, ew_s, eh_s = max(eyes, key=lambda b: b[2] * b[3])
        ex, ey, ew, eh = ex_s * 2, ey_s * 2, ew_s * 2, eh_s * 2

        eye_roi = gray[ey:ey+eh, ex:ex+ew]
        blurred = cv2.GaussianBlur(eye_roi, (5, 5), 0)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(blurred)

        if min_val > 75:  # Eyelid closed
            is_blinking = True
            blink_cooldown_frames = 3
        else:
            cv2.rectangle(frame, (ex, ey), (ex + ew, ey + eh), (0, 255, 0), 2)
            _, thresh = cv2.threshold(blurred, min_val + 20, 255, cv2.THRESH_BINARY_INV)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            px, py = min_loc[0], min_loc[1]
            if contours:
                largest = max(contours, key=cv2.contourArea)
                M = cv2.moments(largest)
                if M["m00"] > 0:
                    px = int(M["m10"] / M["m00"])
                    py = int(M["m01"] / M["m00"])

            iris_screen_x = ex + px
            iris_screen_y = ey + py

            cal_x, cal_y = calibrator.normalize(px / ew, py / eh)

            if blink_cooldown_frames > 0:
                blink_cooldown_frames -= 1
                is_blinking = True
                smooth_gx, smooth_gy = cal_x, cal_y
                prev_gx, prev_gy = cal_x, cal_y
                prev_time = current_time
                gx, gy = cal_x, cal_y
                last_valid_gx, last_valid_gy = gx, gy
            else:
                is_blinking = False

                # Adaptive Zero-Lag Filter:
                # Fast movements get alpha=0.88 (instant tracking), resting gets alpha=0.45
                delta_move = np.hypot(cal_x - prev_gx, cal_y - prev_gy)
                dynamic_alpha = 0.88 if delta_move > 0.04 else 0.45

                smooth_gx = dynamic_alpha * cal_x + (1 - dynamic_alpha) * smooth_gx
                smooth_gy = dynamic_alpha * cal_y + (1 - dynamic_alpha) * smooth_gy
                gx, gy = round(smooth_gx, 3), round(smooth_gy, 3)
                last_valid_gx, last_valid_gy = gx, gy

                iris_history.append((iris_screen_x, iris_screen_y, gx, gy, timestamp_ms))

                dist = np.sqrt((gx - prev_gx)**2 + (gy - prev_gy)**2)
                velocity = dist / dt

                if velocity > 2.8 and (timestamp_ms - last_saccade_time > 140):
                    saccade_detected = True
                    saccade_count += 1
                    last_saccade_time = timestamp_ms
                    if 0.15 < dist < 0.35:
                        saccadic_intrusions += 1

                prev_gx, prev_gy = gx, gy
                prev_time = current_time

    # Draw iris trail
    history_list = list(iris_history)
    for i in range(1, len(history_list)):
        cv2.line(frame, 
                 (history_list[i-1][0], history_list[i-1][1]), 
                 (history_list[i][0], history_list[i][1]), 
                 (255, 255, 0), thickness=2)

    if not is_blinking and len(history_list) > 0:
        curr_x, curr_y = history_list[-1][0], history_list[-1][1]
        cv2.circle(frame, (curr_x, curr_y), 6, (0, 0, 255), -1)
        cv2.circle(frame, (curr_x, curr_y), 10, (0, 255, 255), 1)

    cv2.rectangle(frame, (0, 0), (640, 65), (20, 20, 20), -1)
    cv2.putText(frame, f"GAZE: ({gx:.2f}, {gy:.2f})", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
    cv2.putText(frame, f"T_EYE: {timestamp_ms} ms", (15, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

    if is_blinking:
        cv2.putText(frame, "[BLINK DETECTED]", (260, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 215, 255), 2)
    elif saccade_detected:
        cv2.putText(frame, "[SACCADE SNAP!]", (260, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    else:
        cv2.putText(frame, "TRACKING LOCK", (260, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)

    latest_telemetry = {
        "timestampMs": timestamp_ms,
        "gazeX": float(gx),
        "gazeY": float(gy),
        "saccadeDetected": bool(saccade_detected),
        "isBlinking": bool(is_blinking),
        "saccadicIntrusions": int(saccadic_intrusions),
        "velocity": round(float(velocity), 2)
    }

    packet = f"EYE,{timestamp_ms},{gx:.3f},{gy:.3f},{1 if saccade_detected else 0},{1 if is_blinking else 0},{velocity:.2f}\n"
    if arduino and arduino.is_open:
        try:
            arduino.write(packet.encode())
        except Exception:
            pass

    return frame

def generate_frames():
    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        annotated_frame = process_frame(frame)
        _, buffer = cv2.imencode('.jpg', annotated_frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

@app.route('/')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/telemetry')
def get_telemetry():
    res = jsonify(latest_telemetry)
    res.headers['Access-Control-Allow-Origin'] = '*'
    return res

@app.route('/calibrate', methods=['POST', 'OPTIONS'])
def handle_calibrate():
    if request.method == 'OPTIONS':
        res = make_response()
        res.headers['Access-Control-Allow-Origin'] = '*'
        res.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return res
    data = request.get_json(silent=True) or {}
    calibrator.set_bounds(
        data.get('minX', 0.35),
        data.get('maxX', 0.65),
        data.get('minY', 0.40),
        data.get('maxY', 0.55)
    )
    res = jsonify({"status": "calibrated"})
    res.headers['Access-Control-Allow-Origin'] = '*'
    return res

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, threaded=True)
