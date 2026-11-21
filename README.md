# AeroNeuro: QNX RTOS Pediatric Neuro-Motor Kiosk

A 30-second space arcade kiosk powered by **QNX RTOS** that measures visual reaction time (eyes) vs. motor execution & tremor (hand) to screen for hidden pediatric conditions like **Developmental Coordination Disorder (DCD / Dyspraxia)**, **ADHD**, and **youth concussions**.

---

## 🏆 Target Prize Tracks

1. **Best Use of QNX ($1,000)**: Deterministic real-time OS accurately timestamps sub-200ms saccadic eye movements and motor latency without OS jitter, keeping pediatric video 100% offline and private.
2. **Best Health Hack by Sun Life ($100 Amazon GC each)**: Turns an expensive clinical eye-hand coordination exam into an accessible, kid-friendly game for schools, rural clinics, and youth sports sidelines.
3. **Organizers Choice: Most Adventurous / Best Hardware Prototype**: Custom tactile arcade deck built on Arduino Uno Q + QNX vision.

---

## 🕹 The 30-Second Gameplay Loop

1. **Stage 1: "Target Lock" (15s) — Eye-to-Hand Latency & Impulse Control**
   - Glowing alien targets pop up randomly on screen with occasional red "decoy" flashes (testing ADHD impulse control).
   - QNX Camera timestamps the exact millisecond the player's gaze snaps to target ($t_{\text{eye}}$).
   - Joystick detects crosshair steer and trigger click ($t_{\text{hand}}$).
   - Live 7-segment digital display flashes reaction gap $\Delta t = t_{\text{hand}} - t_{\text{eye}}$ (e.g. 240 ms) with piezo buzzer chime.

2. **Stage 2: "Asteroid Tunnel" (15s) — Smooth Pursuit & Motor Tremor Check**
   - Smooth traversing comet moving across the screen while player locks gaze on it and navigates ship through a narrow corridor.
   - QNX Camera checks for smooth pursuit vs. saccadic intrusions.
   - Joystick measures high-frequency micro-tremor variance (intention tremor / DCD motor jitter) and corridor boundary deviation.

3. **End-of-Run "Neuro-Motor Card" (5s)**
   - Displays 3 core scores:
     1. **Visual Focus & Impulse Score** (e.g., 92/100)
     2. **Eye-to-Hand Latency** (e.g., 235 ms)
     3. **Motor Steadiness (Tremor Index)** (e.g., Low Jitter 94%)
   - Kid-friendly rank badge (e.g., *Sonic Interceptor Specialist*) and exportable summary for parents and clinics.

---

## 🛠 Hardware & Code Architecture Split

| Subsystem | Hardware Platform | Responsibilities |
|---|---|---|
| **Vision & Timing Engine** | Raspberry Pi 5 (QNX OS) | Offline camera capture, lightweight face/eye landmark detection, deterministic real-time timestamps ($t_{\text{eye}}$), sends packets over USB Serial (115200 baud). |
| **Arcade UI & Telemetry** | Arduino Uno Q + Display | Reads incoming gaze coords + Joystick ($j_x, j_y, \text{btn}$), renders arcade game, calculates $t_{\text{hand}} - t_{\text{eye}}$ and jitter variance, drives 7-segment display & buzzer. |

---

## 🚀 Running the Web App Framework

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in the browser. On the launch screen, enable the
camera, connect the controller, move the joystick, and press the separate action
button. **Start Game** unlocks once all four checks are green. Select the mouse
icon next to the sound control to play with a mouse or touchpad without a camera
or controller.

The browser build includes practice, a 20-second Target Lock round, a 25-second
Comet Tunnel star chase, and a player scorecard. The camera provides a local
preview in this build. The QNX measurements described above are project goals.

### Arduino controller input

Use **Connect Arduino** in a browser with Web Serial support and select the
controller's serial port. The controller must expose a browser-visible serial
stream at 115200 baud and continuously send newline-delimited JSON, for example:

```json
{"x":0.45,"y":-0.2,"btn":false}
```

Use values from -1 to 1 for the two joystick axes (positive X is right, positive
Y is down). Send the **separate button's** debounced state as `btn`, including both
press and release. Keep sending packets while the controls are idle so the app
can detect a dropped connection. A compatible USB gamepad can also pass the
hardware checks using its first two axes and first button.
