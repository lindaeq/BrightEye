import cv2
import numpy as np
import time
import os
from collections import deque
from pathlib import Path
from threading import Condition, Thread
from flask import Flask, Response, jsonify, request, make_response

app = Flask(__name__)

# Optional serial output for hardware configured to receive gaze packets.
arduino = None
arduino_port = os.environ.get('EYE_TRACKER_SERIAL_PORT')
if arduino_port:
    try:
        import serial
        arduino = serial.Serial(arduino_port, 115200, timeout=0.02)
        print(f"[SERIAL] Connected to Arduino on {arduino_port}")
    except Exception as e:
        print(f"[SERIAL] Error opening Arduino: {e}")

cascade_path = os.environ.get('EYE_TRACKER_CASCADE')
if not cascade_path:
    cascade_name = 'haarcascade_eye.xml'
    packaged_data = getattr(getattr(cv2, 'data', None), 'haarcascades', None)
    search_dirs = [
        Path('/usr/share/opencv4/haarcascades'),
        Path('/usr/share/opencv/haarcascades'),
    ]
    if packaged_data:
        search_dirs.insert(0, Path(packaged_data))
    cascade_path = next(
        (str(directory / cascade_name) for directory in search_dirs if (directory / cascade_name).is_file()),
        None,
    )
    if not cascade_path:
        raise RuntimeError(
            'Could not find haarcascade_eye.xml. Install opencv-data or set EYE_TRACKER_CASCADE to the XML file.'
        )
eye_cascade = cv2.CascadeClassifier(cascade_path)
if eye_cascade.empty():
    raise RuntimeError(f'Could not load eye cascade: {cascade_path}')

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
smooth_gx, smooth_gy = 0.5, 0.5
tracked_eye_center = None

# ==========================================
# CALIBRATOR & ZERO-DELAY ENGINE
# ==========================================
class FastEyeCalibrator:
    def __init__(self):
        self.mapping = None

    def fit(self, points):
        expected = np.array([[.84, .18], [.16, .18], [.84, .82], [.16, .82], [.5, .5]])
        if not isinstance(points, list) or len(points) != len(expected):
            raise ValueError('Capture all five targets.')
        try:
            raw = np.asarray([[point['rawX'], point['rawY']] for point in points], dtype=float)
        except (TypeError, KeyError, ValueError):
            raise ValueError('Invalid eye samples.') from None
        if raw.shape != (len(expected), 2) or not np.isfinite(raw).all() or (raw < 0).any() or (raw > 1).any():
            raise ValueError('Invalid eye samples.')
        if np.linalg.svd(raw - raw.mean(axis=0), compute_uv=False)[-1] < .018:
            raise ValueError('The samples are too close together. Keep your head still and look at each star.')
        design = np.column_stack((raw, np.ones(len(raw))))
        mapping, _, _, _ = np.linalg.lstsq(design, expected, rcond=None)
        if np.max(np.linalg.norm(design @ mapping - expected, axis=1)) > .23:
            raise ValueError('The samples did not match the targets. Look at each star before capturing.')
        self.mapping = mapping

    def normalize(self, rx, ry):
        mapping = self.mapping
        if mapping is None:
            coordinates = ((rx - .36) / .28, (ry - .41) / .13)
        else:
            coordinates = np.array([rx, ry, 1.0]) @ mapping
        return np.clip(coordinates, .02, .98)

calibrator = FastEyeCalibrator()

latest_telemetry = {
    "timestampMs": 0, "gazeX": 0.5, "gazeY": 0.5,
    "saccadeDetected": False, "isBlinking": False,
    "saccadicIntrusions": 0, "velocity": 0.0
}

def process_frame(frame):
    global prev_gx, prev_gy, prev_time, smooth_gx, smooth_gy
    global saccade_count, saccadic_intrusions, last_saccade_time
    global is_blinking, last_valid_gx, last_valid_gy
    global latest_telemetry, tracked_eye_center

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

    raw_x = raw_y = None
    was_blinking = is_blinking
    is_blinking = True
    eye_box = None
    if len(eyes) > 0:
        # Scale the detection box back to the actual capture dimensions.
        def eye_center(box):
            x, y, width, height = box
            return x + width / 2, y + height / 2

        if tracked_eye_center is None or dt > .75:
            eye_box = max(eyes, key=lambda box: box[2] * box[3])
        else:
            eye_box = min(eyes, key=lambda box: np.hypot(*(np.subtract(eye_center(box), tracked_eye_center))))
            if np.hypot(*(np.subtract(eye_center(eye_box), tracked_eye_center))) > 35:
                eye_box = None
    if eye_box is not None:
        ex_s, ey_s, ew_s, eh_s = eye_box
        height, width = gray.shape
        ex, ew = round(ex_s * width / 320), round(ew_s * width / 320)
        ey, eh = round(ey_s * height / 240), round(eh_s * height / 240)

        eye_roi = gray[ey:ey+eh, ex:ex+ew]
        blurred = cv2.GaussianBlur(eye_roi, (5, 5), 0)
        min_val, _, min_loc, _ = cv2.minMaxLoc(blurred)
        contrast = float(np.median(blurred)) - min_val

        if contrast >= 18:
            is_blinking = False
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

            tracked_eye_center = eye_center(eye_box)
            raw_x, raw_y = 1.0 - px / ew, py / eh
            cal_x, cal_y = calibrator.normalize(raw_x, raw_y)

            if was_blinking:
                # Reacquire immediately without counting the gap as an eye movement.
                smooth_gx, smooth_gy = cal_x, cal_y
                gx, gy = round(cal_x, 3), round(cal_y, 3)
            else:
                # Adaptive Zero-Lag Filter:
                # Smooth fixation jitter while responding faster to larger movements.
                delta_move = np.hypot(cal_x - prev_gx, cal_y - prev_gy)
                dynamic_alpha = 0.65 if delta_move > 0.10 else 0.30

                smooth_gx = dynamic_alpha * cal_x + (1 - dynamic_alpha) * smooth_gx
                smooth_gy = dynamic_alpha * cal_y + (1 - dynamic_alpha) * smooth_gy
                gx, gy = round(smooth_gx, 3), round(smooth_gy, 3)
                dist = np.sqrt((gx - prev_gx)**2 + (gy - prev_gy)**2)
                velocity = dist / dt

                if velocity > 2.8 and (timestamp_ms - last_saccade_time > 140):
                    saccade_detected = True
                    saccade_count += 1
                    last_saccade_time = timestamp_ms
                    if 0.15 < dist < 0.35:
                        saccadic_intrusions += 1

            last_valid_gx, last_valid_gy = gx, gy
            prev_gx, prev_gy = gx, gy
            prev_time = current_time
            iris_history.append((iris_screen_x, iris_screen_y, gx, gy, timestamp_ms))

    if is_blinking:
        iris_history.clear()

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
        cv2.putText(frame, "[EYE NOT TRACKED]", (260, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 215, 255), 2)
    elif saccade_detected:
        cv2.putText(frame, "[SACCADE SNAP!]", (260, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    else:
        cv2.putText(frame, "TRACKING LOCK", (260, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)

    latest_telemetry = {
        "timestampMs": timestamp_ms,
        "gazeX": float(gx),
        "gazeY": float(gy),
        "rawX": raw_x,
        "rawY": raw_y,
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
    last_jpeg = None
    while True:
        with frame_available:
            frame_available.wait_for(lambda: latest_jpeg is not last_jpeg)
            last_jpeg = latest_jpeg
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + last_jpeg + b'\r\n')


frame_available = Condition()
latest_jpeg = None


def capture_frames():
    global latest_jpeg
    while True:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.05)
            continue
        annotated_frame = process_frame(frame)
        encoded, buffer = cv2.imencode('.jpg', annotated_frame)
        if encoded:
            with frame_available:
                latest_jpeg = buffer.tobytes()
                frame_available.notify_all()

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
    try:
        calibrator.fit(data.get('points') if isinstance(data, dict) else None)
    except ValueError as error:
        return jsonify({"message": str(error)}), 400
    res = jsonify({"status": "calibrated"})
    res.headers['Access-Control-Allow-Origin'] = '*'
    return res

if __name__ == '__main__':
    Thread(target=capture_frames, daemon=True).start()
    app.run(host='0.0.0.0', port=8080, threaded=True)
