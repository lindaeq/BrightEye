// controller.ino
// Reads buttons + joystick and streams the full controller state over USB serial
// as one JSON line, about 50 times per second.
//
// Example line:  {"b1":1,"b2":0,"sw":0,"x":-12,"y":87}
//   b1, b2, sw : 1 = pressed, 0 = released
//   x, y       : -100 .. 100, 0 = centered (deadzone applied)
//
// Wiring (Arduino Uno):
//   Button 1   : one leg -> pin 2, other leg -> GND
//   Button 2   : one leg -> pin 3, other leg -> GND
//   Joystick   : GND -> GND, +5V -> 5V, VRx -> A0, VRy -> A1, SW -> pin 4
// No resistors needed: INPUT_PULLUP uses the Arduino's internal pull-ups.

const int BTN1_PIN = 2;
const int BTN2_PIN = 3;
const int SW_PIN   = 4;
const int X_PIN    = A0;
const int Y_PIN    = A1;

const unsigned long SEND_INTERVAL_MS = 20;  // 50 updates per second
const unsigned long DEBOUNCE_MS      = 15;  // ignore contact bounce shorter than this
const int DEADZONE                   = 8;   // in output units (-100..100)

// ---- Debounced button ------------------------------------------------------
struct Button {
  int pin;
  bool stable;          // debounced state: true = pressed
  bool lastRaw;
  unsigned long lastChange;
};

Button buttons[] = {
  {BTN1_PIN, false, false, 0},
  {BTN2_PIN, false, false, 0},
  {SW_PIN,   false, false, 0},
};
const int NUM_BUTTONS = sizeof(buttons) / sizeof(buttons[0]);

void updateButton(Button &b) {
  bool raw = (digitalRead(b.pin) == LOW);   // LOW = pressed with INPUT_PULLUP
  if (raw != b.lastRaw) {                   // reading changed: restart the timer
    b.lastRaw = raw;
    b.lastChange = millis();
  }
  if (millis() - b.lastChange >= DEBOUNCE_MS) {
    b.stable = raw;                         // held steady long enough: accept it
  }
}

// ---- Joystick --------------------------------------------------------------
int centerX = 512;
int centerY = 512;

// Converts a raw 0..1023 reading to -100..100 around the calibrated center.
int axisValue(int raw, int center) {
  long v;
  if (raw >= center) v = map(raw, center, 1023, 0, 100);
  else               v = map(raw, 0, center, -100, 0);
  if (abs(v) < DEADZONE) v = 0;
  return constrain(v, -100, 100);
}

// ---- Main ------------------------------------------------------------------
unsigned long lastSend = 0;

void setup() {
  for (int i = 0; i < NUM_BUTTONS; i++) {
    pinMode(buttons[i].pin, INPUT_PULLUP);
  }
  Serial.begin(115200);

  // Calibrate the joystick center. Don't touch the stick while the board starts.
  long sumX = 0, sumY = 0;
  for (int i = 0; i < 32; i++) {
    sumX += analogRead(X_PIN);
    sumY += analogRead(Y_PIN);
    delay(2);
  }
  centerX = sumX / 32;
  centerY = sumY / 32;
}

void loop() {
  for (int i = 0; i < NUM_BUTTONS; i++) updateButton(buttons[i]);

  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();

    int x = axisValue(analogRead(X_PIN), centerX);
    int y = axisValue(analogRead(Y_PIN), centerY);

    // Build one JSON line. Field names are the contract with the front end.
    Serial.print("{\"b1\":"); Serial.print(buttons[0].stable ? 1 : 0);
    Serial.print(",\"b2\":"); Serial.print(buttons[1].stable ? 1 : 0);
    Serial.print(",\"sw\":"); Serial.print(buttons[2].stable ? 1 : 0);
    Serial.print(",\"x\":");  Serial.print(x);
    Serial.print(",\"y\":");  Serial.print(y);
    Serial.println("}");
  }
}
