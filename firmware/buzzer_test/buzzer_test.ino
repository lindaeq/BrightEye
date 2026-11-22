#include <stdio.h>
#include <string.h>

// buzzer_test.ino
// Yifan controller feedback plus an operator-started timed buzzer test.
// Reads 1 button + joystick and streams the full controller state over USB serial
// as one JSON line, 50 times per second.
//
// Example line:  {"b1":1,"sw":0,"x":-12,"y":87}
//   b1, sw : 1 = pressed, 0 = released
//   x, y   : -100 .. 100, 0 = centered (deadzone applied)
//
// Wiring (Arduino Uno / Mega 2560 / Uno Q):
//   Piezo      : D4 via board-compatible passive piezo wiring or driver
//   Button 1   : one leg -> pin 2 (D2), other leg -> GND
//   Joystick   : GND -> GND, VRx -> A0, VRy -> A1, SW -> D13 (optional)
//   Uno Q      : Use a 3.3 V-compatible joystick powered from 3V3. Never feed 5 V into A0/A1.
//   Uno R3 / Mega 2560: Power a 5 V joystick from 5V.
// No external button resistors needed: INPUT_PULLUP uses the Arduino's internal pull-ups.

// On UNO Q (Zephyr 0.55+), uncomment for a 3.3 V USB-UART adapter on D0/D1:
// #define BUZZ_USE_HARDWARE_UART
#if defined(ARDUINO_UNO_Q) && defined(BUZZ_USE_HARDWARE_UART)
#define CONTROLLER_PORT Serial1
#elif defined(ARDUINO_UNO_Q)
#define CONTROLLER_PORT Serial
#define CONTROLLER_MONITOR_ONLY
#else
#define CONTROLLER_PORT Serial
#endif

const int BTN1_PIN = 2;
const int BUZZER_PIN = 4;  // Use a board-compatible passive piezo or driver.
const int SW_PIN   = 13;
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

// The test runs only after START_BUZZES is received over serial.
const unsigned int BUZZ_HZ = 1500;
const unsigned long BUZZ_DURATION_MS = 50;
const unsigned long POST_BUZZ_QUIET_MS = 1200;
uint32_t finalBuzzMs = 0;
bool guardingFinalBuzz = false;
bool previousActionButton = false;
uint32_t nextBuzzMs = 0;
uint32_t pendingBuzzUs = 0;
uint8_t pendingBuzzNumber = 0;
uint8_t buzzNumber = 0;
uint8_t buzzCount = 0;
char command[20];
uint8_t commandLength = 0;
bool commandOverflow = false;

void readCommands() {
  // Bound the serial work per loop so a noisy sender cannot starve the controller.
  for (uint8_t count = 0; count < 16 && CONTROLLER_PORT.available() > 0; count++) {
    char ch = CONTROLLER_PORT.read();
    if (ch == '\r') continue;
    if (ch != '\n') {
      if (commandLength < sizeof(command) - 1) command[commandLength++] = ch;
      else commandOverflow = true;
      continue;
    }
    command[commandLength] = '\0';
    if (!commandOverflow && strcmp(command, "STOP_BUZZES") == 0) {
      buzzCount = 0;
      guardingFinalBuzz = false;
      noTone(BUZZER_PIN);
    } else if (!commandOverflow && strcmp(command, "START_BUZZES") == 0 &&
               buzzCount == 0 && pendingBuzzNumber == 0 && !guardingFinalBuzz) {
      buzzNumber = 0;
      buzzCount = random(5, 11);
      nextBuzzMs = millis() + random(1800, 2901);
    }
    commandLength = 0;
    commandOverflow = false;
  }
}

void updateBuzzer(uint32_t now) {
  if (!buzzCount || pendingBuzzNumber || (int32_t)(now - nextBuzzMs) < 0) return;
  // Board-clock timestamp of the tone request. Acoustic onset needs a microphone or trigger.
  pendingBuzzUs = micros();
  tone(BUZZER_PIN, BUZZ_HZ, BUZZ_DURATION_MS);
  pendingBuzzNumber = ++buzzNumber;
  if (buzzNumber == buzzCount) {
    buzzCount = 0;
    finalBuzzMs = now;
    guardingFinalBuzz = true;
  } else {
    nextBuzzMs = now + random(1800, 2901);
  }
}

bool writeIfReady(const char *line, int length, size_t capacity) {
  if (length <= 0 || (size_t)length >= capacity) return false;
#ifndef CONTROLLER_MONITOR_ONLY
  if (CONTROLLER_PORT.availableForWrite() < length) return false;
#endif
  return CONTROLLER_PORT.write((const uint8_t *)line, length) == (size_t)length;
}

void setup() {
  for (int i = 0; i < NUM_BUTTONS; i++) {
    pinMode(buttons[i].pin, INPUT_PULLUP);
  }
  pinMode(BUZZER_PIN, OUTPUT);
  CONTROLLER_PORT.begin(115200);

  // Calibrate the joystick center. Don't touch the stick while the board starts.
  long sumX = 0, sumY = 0;
  for (int i = 0; i < 32; i++) {
    sumX += analogRead(X_PIN);
    sumY += analogRead(Y_PIN);
    delay(2);
  }
  centerX = sumX / 32;
  centerY = sumY / 32;
  randomSeed(micros() ^ ((unsigned long)centerX << 10) ^ centerY);
  tone(BUZZER_PIN, 1000, 100);  // Yifan startup feedback.
}

void loop() {
  for (int i = 0; i < NUM_BUTTONS; i++) updateButton(buttons[i]);

  const uint32_t now = millis();
  if (guardingFinalBuzz && now - finalBuzzMs >= POST_BUZZ_QUIET_MS) {
    guardingFinalBuzz = false;
  }
#ifndef CONTROLLER_MONITOR_ONLY
  readCommands();
  updateBuzzer(now);
#endif

  const bool actionButton = buttons[0].stable;
  // Keep the same packets during a test, but reserve the piezo for logged tones.
  if (actionButton && !previousActionButton && !buzzCount && !pendingBuzzNumber && !guardingFinalBuzz) {
    tone(BUZZER_PIN, 1500, 50);
  }
  previousActionButton = actionButton;

  char line[64];
  if (pendingBuzzNumber) {
    int length = snprintf(line, sizeof(line), "{\"event\":\"buzz\",\"n\":%u,\"t_buzz\":%lu}\n",
                          (unsigned int)pendingBuzzNumber, (unsigned long)pendingBuzzUs);
    if (!writeIfReady(line, length, sizeof(line))) return;
    pendingBuzzNumber = 0;
  }

  if (now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;
#ifndef CONTROLLER_MONITOR_ONLY
    const uint32_t sampledUs = micros();
#endif
    const int x = axisValue(analogRead(X_PIN), centerX);
    const int y = axisValue(analogRead(Y_PIN), centerY);
#ifdef CONTROLLER_MONITOR_ONLY
    int length = snprintf(line, sizeof(line), "{\"b1\":%d,\"sw\":%d,\"x\":%d,\"y\":%d}\n",
                          buttons[0].stable, buttons[1].stable, x, y);
#else
    int length = snprintf(line, sizeof(line), "{\"b1\":%d,\"sw\":%d,\"x\":%d,\"y\":%d,\"t_us\":%lu}\n",
                          buttons[0].stable, buttons[1].stable, x, y, (unsigned long)sampledUs);
#endif
    writeIfReady(line, length, sizeof(line));
  }
}