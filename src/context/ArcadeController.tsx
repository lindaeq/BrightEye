import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type SerialPort = {
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
};
type SerialNavigator = Navigator & { serial?: { requestPort: () => Promise<SerialPort> } };
type Verification = { joystick: boolean; button: boolean };
type ControllerInput = { x: number; y: number; presses: number };
type ControllerStatus = Verification & { source: 'serial' | 'gamepad' | null };
type SerialSession = {
  reader?: ReadableStreamDefaultReader<Uint8Array>;
  writer?: WritableStreamDefaultWriter<Uint8Array>;
  stopped: boolean;
  supportsBuzzCapture?: boolean;
};
type BuzzLog = {
  buzzes: { n: number; t_buzz: number }[];
  stick: { t_us: number; x: number; y: number }[];
};
const unverified = { joystick: false, button: false };
const disconnected: ControllerStatus = { source: null, ...unverified };
const heartbeatMs = 2000;

function isButtonState(value: unknown): value is boolean | 0 | 1 {
  return typeof value === 'boolean' || value === 0 || value === 1;
}

function parseSerialLine(line: string): unknown {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function isBoardTime(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
}

function decodeControllerPacket(packet: unknown) {
  if (!packet || typeof packet !== 'object' || !('x' in packet) || !('y' in packet)) return null;

  const { x, y } = packet;
  if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return null;

  // Yifan's sketch sends percent axes and uses b1 for the separate action button.
  // The joystick switch (sw) is intentionally unused.
  if ('b1' in packet) {
    if (!isButtonState(packet.b1) || Math.abs(x) > 100 || Math.abs(y) > 100) return null;
    return {
      x: x / 100, y: y / 100, pressed: Boolean(packet.b1),
      t_us: 't_us' in packet && isBoardTime(packet.t_us) ? packet.t_us : null,
    };
  }

  if (!('btn' in packet) || !isButtonState(packet.btn) || Math.abs(x) > 1 || Math.abs(y) > 1) return null;
  return { x, y, pressed: Boolean(packet.btn), t_us: null };
}

function getGamepads() {
  try {
    return navigator.getGamepads?.() ?? [];
  } catch {
    return [];
  }
}

const ControllerContext = createContext<ReturnType<typeof useControllerState> | null>(null);

function useControllerState() {
  const input = useRef<ControllerInput>({ x: 0, y: 0, presses: 0 });
  const session = useRef<SerialSession | null>(null);
  const serialInput = useRef({ x: 0, y: 0, lastPacket: -Infinity, presses: 0, ...unverified });
  const [status, setStatus] = useState(disconnected);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [mouseMode, setMouseMode] = useState(false);
  const buzzLog = useRef<BuzzLog>({ buzzes: [], stick: [] });
  const captureActive = useRef(false);
  const [capturingBuzzes, setCapturingBuzzes] = useState(false);
  const [buzzesLogged, setBuzzesLogged] = useState(0);
  const [supportsBuzzCapture, setSupportsBuzzCapture] = useState(false);
  const captureTimer = useRef<number | undefined>(undefined);
  const serial = (navigator as SerialNavigator).serial;

  const stopBuzzCapture = useCallback(async () => {
    window.clearTimeout(captureTimer.current);
    if (!captureActive.current) return;
    captureActive.current = false;
    setCapturingBuzzes(false);
    await session.current?.writer?.write(new TextEncoder().encode('STOP_BUZZES\n'));
  }, []);

  async function startBuzzCapture() {
    const writer = session.current?.writer;
    if (!writer || !session.current?.supportsBuzzCapture || captureActive.current) return;
    buzzLog.current = { buzzes: [], stick: [] };
    captureActive.current = true;
    setBuzzesLogged(0);
    setCapturingBuzzes(true);
    captureTimer.current = window.setTimeout(() => { void stopBuzzCapture().catch(() => {}); }, 32000);
    try {
      await writer.write(new TextEncoder().encode('START_BUZZES\n'));
    } catch (error) {
      void stopBuzzCapture().catch(() => {});
      throw error;
    }
  }

  useEffect(() => {
    let frame: number;
    let lastStatus = disconnected;
    const verifiedPads = new Map<number, Verification & { down: boolean; presses: number; id: string }>();
    let previousPresses = 0;
    let previousSource: SerialSession | string | null = null;

    const poll = (now: number) => {
      let next = disconnected;
      const stream = serialInput.current;
      let x = 0, y = 0, presses = 0;
      let pickedPad: Gamepad | null = null;
      if (session.current && now - stream.lastPacket < heartbeatMs) {
        next = { source: 'serial', joystick: stream.joystick, button: stream.button };
        ({ x, y, presses } = stream);
      } else if (!session.current) {
        const connected = getGamepads();
        for (const index of verifiedPads.keys()) {
          if (!connected[index]) verifiedPads.delete(index);
        }
        let selected: { pad: Gamepad; state: Verification & { presses: number } } | undefined;
        for (const pad of connected) {
          if (!pad || pad.axes.length < 2 || !pad.buttons.length) continue;
          const down = pad.buttons[0].pressed;
          const axisMoved = Math.hypot(pad.axes[0], pad.axes[1]) > 0.25;
          const before = verifiedPads.get(pad.index);
          const old = before?.id === pad.id ? before : undefined;
          const state = {
            id: pad.id, down, joystick: axisMoved || !!old?.joystick, button: down || !!old?.button,
            presses: (old?.presses ?? 0) + Number(down && !old?.down),
          };
          verifiedPads.set(pad.index, state);
          if (!selected || (state.joystick && state.button && !(selected.state.joystick && selected.state.button))) {
            selected = { pad, state };
          }
        }
        if (selected) {
          const { pad, state } = selected;
          pickedPad = pad;
          next = { source: 'gamepad', joystick: state.joystick, button: state.button };
          [x, y] = pad.axes;
          presses = state.presses;
        }
      }

      const source = pickedPad ? pickedPad.index + ':' + pickedPad.id : next.source === 'serial' ? session.current : null;
      const pressDelta = source === previousSource ? Math.max(0, presses - previousPresses) : 0;
      previousSource = source;
      previousPresses = presses;
      input.current = { x, y, presses: input.current.presses + pressDelta };
      if (next.source !== lastStatus.source || next.joystick !== lastStatus.joystick || next.button !== lastStatus.button) {
        setStatus(next);
        lastStatus = next;
      }
      frame = requestAnimationFrame(poll);
    };

    frame = requestAnimationFrame(poll);
    return () => {
      cancelAnimationFrame(frame);
      void stopBuzzCapture().catch(() => {});
      const current = session.current;
      if (current) {
        current.stopped = true;
        void current.reader?.cancel().catch(() => {});
        session.current = null;
      }
    };
  }, [stopBuzzCapture]);

  async function connect() {
    if (!serial || session.current) return;
    const current: SerialSession = { stopped: false };
    session.current = current;
    setSupportsBuzzCapture(false);
    serialInput.current = { x: 0, y: 0, lastPacket: -Infinity, presses: 0, ...unverified };
    let port: SerialPort | undefined;
    let opened = false;
    let failed = false;
    try {
      setConnecting(true);
      setMessage(null);
      port = await serial.requestPort();
      if (current.stopped) return;
      await port.open({ baudRate: 115200 });
      opened = true;
      if (current.stopped) return;
      setConnecting(false);
      setMessage({ text: 'Waiting for a controller signal. Move the joystick and press the separate button.' });
      if (!port.readable) throw new Error('Serial port is not readable');
      const reader = port.readable.getReader();
      current.reader = reader;
      const decoder = new TextDecoder();
      let buffer = '';
      let buttonHeld = false;
      try {
        current.writer = port.writable?.getWriter();
        while (!current.stopped) {
          const { value, done } = await reader.read();
          if (done || current.stopped) break;
          buffer += decoder.decode(value, { stream: true });
          let end: number;
          while ((end = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, end).trim();
            buffer = buffer.slice(end + 1);
            const message = parseSerialLine(line);
            if (captureActive.current && message && typeof message === 'object' &&
                'event' in message && message.event === 'buzz' && 'n' in message &&
                message.n === buzzLog.current.buzzes.length + 1 && message.n <= 10 &&
                't_buzz' in message && isBoardTime(message.t_buzz)) {
              buzzLog.current.buzzes.push({ n: message.n, t_buzz: message.t_buzz });
              setBuzzesLogged(message.n);
            }
            const packet = decodeControllerPacket(message);
            if (!packet) continue;

            const { x, y, pressed, t_us } = packet;
            if (t_us !== null && !current.supportsBuzzCapture) {
              current.supportsBuzzCapture = true;
              setSupportsBuzzCapture(true);
            }
            if (captureActive.current && t_us !== null && buzzLog.current.stick.length < 5000) {
              buzzLog.current.stick.push({ x: Math.round(x * 100), y: Math.round(y * 100), t_us });
            }
            const state = serialInput.current;
            const now = performance.now();
            if (now - state.lastPacket >= heartbeatMs) {
              state.joystick = false;
              state.button = false;
              buttonHeld = false;
            }
            state.x = x;
            state.y = y;
            state.joystick ||= Math.hypot(x, y) > 0.25;
            state.button ||= pressed;
            state.presses += Number(pressed && !buttonHeld);
            state.lastPacket = now;
            buttonHeld = pressed;
          }
          if (buffer.length > 1024) buffer = '';
        }
      } finally {
        reader.releaseLock();
        current.writer?.releaseLock();
      }
    } catch (error) {
      failed = true;
      if (!current.stopped) {
        const cancelled = error instanceof DOMException && error.name === 'NotFoundError';
        setMessage({
          text: cancelled ? 'No serial port selected.' : 'Could not read the Arduino. Check the cable and close any serial monitor.',
          error: !cancelled,
        });
      }
    } finally {
      if (opened) await port?.close().catch(() => {});
      if (session.current === current) {
        window.clearTimeout(captureTimer.current);
        captureActive.current = false;
        setCapturingBuzzes(false);
        session.current = null;
        setConnecting(false);
        if (opened && !failed) {
          setMessage({ text: 'Serial disconnected. Reconnect the Arduino to use hardware controls.', error: !current.stopped });
        }
      }
    }
  }

  function disconnect() {
    const current = session.current;
    if (!current?.reader) return;
    current.stopped = true;
    void stopBuzzCapture().catch(() => {});
    serialInput.current.lastPacket = -Infinity;
    void current.reader.cancel().catch(() => {});
  }

  return {
    buzzLog, buzzesLogged, capturingBuzzes, startBuzzCapture, stopBuzzCapture,
    canCaptureBuzzes: supportsBuzzCapture && !!session.current?.writer && status.source === 'serial',
    input, status, connecting, message, mouseMode, setMouseMode, canConnectSerial: !!serial, connect, disconnect, serialOpen: !!session.current?.reader };
}

export function ArcadeControllerProvider({ children }: { children: ReactNode }) {
  const value = useControllerState();
  return <ControllerContext.Provider value={value}>{children}</ControllerContext.Provider>;
}

export function useArcadeController() {
  const controller = useContext(ControllerContext);
  if (!controller) throw new Error('Arcade controller provider is missing');
  return controller;
}
