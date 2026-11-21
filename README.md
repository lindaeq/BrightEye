# AeroNeuro: QNX RTOS Pediatric Neuro-Motor Kiosk

A space arcade kiosk for practicing joystick controls and reviewing in-game movement and timing.

## 🏆 Target Prize Tracks

1. **Best Use of QNX ($1,000)**: Deterministic real-time OS accurately timestamps sub-200ms saccadic eye movements and motor latency without OS jitter, keeping pediatric video 100% offline and private.
2. **Best Health Hack by Sun Life ($100 Amazon GC each)**: Turns an expensive clinical eye-hand coordination exam into an accessible, kid-friendly game for schools, rural clinics, and youth sports sidelines.
3. **Organizers Choice: Most Adventurous / Best Hardware Prototype**: Custom tactile arcade deck built on Arduino Uno Q + QNX vision.

---

## Gameplay and operator data

- Target Lock records shots, decoy hits, and time from a round target appearing to a successful shot.
- Comet Tunnel records the ship path, star captures, path efficiency, path deviation, and heading changes for completed chases using continuous steering.
- The Operator Dashboard shows up to 12 completed runs in memory, exports summary CSV, and replays game positions and actions from both missions. Replay samples the scene about 25 times per second. Camera footage is never recorded.
- Controller changes can reflect deliberate corrections, controller calibration, or hardware noise. The in-game measurements are exploratory. DCD assessment uses standardized testing and functional history. [International DCD practice recommendations](https://doi.org/10.1111/dmcn.14132)

## 🛠 Planned Hardware & Code Architecture

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

Open [the controller sketch](firmware/controller/controller.ino) in Arduino IDE
and upload it to the board. This is the original `yifan_controller` sketch (commit `0832a58`), with the startup and button-press beeps. Leave the stick
centered while the board starts so it can calibrate. The sketch assigns joystick
VRx to A0, VRy to A1, the separate button to D2, and the optional joystick switch
to D13. For Uno Q, power a 3.3 V-compatible joystick from **3V3**. The Uno Q's
A0 and A1 pins are not 5 V tolerant. The original sketch's 5 V wiring comment is for the classic Arduino Uno.
[Uno Q analog input specifications](https://docs.arduino.cc/tutorials/uno-q/power-specification/#analog-inputs)

Use **Connect Arduino** in a browser with Web Serial support, then select the
serial port carrying the sketch's output. Close any serial monitor that has the
port open. The sketch sends newline-delimited JSON at 115200 baud:

```json
{"b1":1,"sw":0,"x":-12,"y":87}
```

The game scales the -100 to 100 axes and treats `b1` as the action button.
`sw` is the joystick's built-in switch. Older controllers that send
`{"x":0.45,"y":-0.2,"btn":false}` with normalized axes are still supported.
A compatible USB gamepad can also pass the hardware checks.

On Uno Q, output visible only in the Arduino App Lab console must be exposed
through a browser-accessible serial port before Web Serial can read it.
[Uno Q user manual](https://docs.arduino.cc/tutorials/uno-q/user-manual/)

### Buzzer test and gaze capture

Upload [the combined controller and buzzer sketch](firmware/buzzer_test/buzzer_test.ino)
for normal controller play and the randomized sequence in Operator View. Upload
only one sketch. The original Yifan sketch remains available for standard
controller play.

The combined sketch retains Yifan's startup chime and separate-button beep.
The button continues to work during a test, but its feedback beep is suppressed
from arming through 1.2 seconds after the final buzz, or until the operator stops
the test. Only the scheduled test tones produce `t_buzz` records. Confirm the
participant is comfortable with the sound and verify the buzzer output on the
bench first. **Start buzzer test** sends `START_BUZZES`. The firmware schedules
5–10 tones with randomized 1.8–2.9 s intervals. **Stop buzzer test** sends
`STOP_BUZZES`.

The buffered serial path checks TX capacity before each write. It gives buzz
records priority and can skip a stick frame under backpressure. `t_buzz` is the
board's `micros()` reading immediately before the tone command, not the acoustic
onset. `t_us` on joystick frames uses the same board clock. To measure sound
onset or validate latency, use a synchronized microphone or other external
timing measurement.

On Uno Q with Zephyr 0.55+, the default Serial Monitor mode still sends the
ordinary controller packets. The Monitor uses RPC and does not provide a
buffered UART write guarantee. For timed tests, enable `BUZZ_USE_HARDWARE_UART`
in the sketch and use a 3.3 V USB-to-UART adapter on D0/D1 with common ground.
Connect the browser to the adapter's port. The Uno Q UART configuration and
timing should be verified on the actual board.
[Arduino Uno Q Serial documentation](https://support.arduino.cc/hc/en-us/articles/27251870677916-Migrating-to-Zephyr-core-0-55-0-on-UNO-Q)

Download the controller log from **Operator View**. You can review stick data
directly. For gaze, add the following fields to the downloaded JSON and import it:

- `target`: fixed target ellipse in the same normalized coordinate space as gaze, with `x`, `y`, `radiusX`, and `radiusY`.
- `gaze`: array of samples of the form `{"ms":-180,"x":0.5,"y":0.5,"valid":true}`. Use eye-tracker acquisition timestamps mapped to milliseconds relative to the first MCU buzz command. Use `valid:false` for blinks or missing data.
- `syncErrorMs`: measured uncertainty of that clock mapping. Serial receipt time is not a synchronization measurement.
- Optional `acousticMs` on each record in `buzzes`: measured acoustic onset in the same relative timeline.

The app requires stable pre-buzz fixation, confirms a break with two off-target
samples, and confirms a return with 80 ms on target. Missing baseline, tracking
gaps, and no return within 1.2 seconds are shown as separate outcomes. The plot
shows trial order to support exploratory review. The current camera preview
does not capture gaze, and these measurements have no ASD or ADHD screening cutoffs.
