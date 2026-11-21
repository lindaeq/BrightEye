# Controller firmware

## Arduino controller input

Open [the controller sketch](controller/controller.ino) in Arduino IDE
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

## Buzzer test and gaze capture

Upload [the combined controller and buzzer sketch](buzzer_test/buzzer_test.ino)
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
