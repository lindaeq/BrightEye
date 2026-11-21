import { useEffect, useRef, useState } from 'react';

const QNX_STREAM_URL = 'http://localhost:8080/';
const QNX_TELEMETRY_URL = 'http://localhost:8080/telemetry';

export function useCameraFeed() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const currentRequest = useRef(0);
  const busy = useRef(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [isQnx, setIsQnx] = useState(false);

  // Probe QNX Raspberry Pi 5 camera server on mount
  useEffect(() => {
    let unmounted = false;

    async function checkQnxCamera() {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(QNX_TELEMETRY_URL, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok && !unmounted) {
          setIsQnx(true);
          setReady(true);
          setError('');
          return;
        }
      } catch {
        // QNX Pi stream not active right now
      }
    }

    checkQnxCamera();
    const interval = setInterval(checkQnxCamera, 3000);

    return () => {
      unmounted = true;
      clearInterval(interval);
      currentRequest.current++;
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function enable() {
    if (isQnx) return;
    if (busy.current) return;
    if (!navigator.mediaDevices?.getUserMedia || !video.current) {
      setError('Camera access requires localhost or a secure connection.');
      return;
    }
    busy.current = true;
    setPending(true);
    setReady(false);
    setError('');
    const request = ++currentRequest.current;
    stream.current?.getTracks().forEach((track) => track.stop());
    const preview = video.current;
    try {
      const feed = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (request !== currentRequest.current) {
        feed.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = feed;
      const track = feed.getVideoTracks()[0];
      if (!track) throw new Error('Camera stream has no video track');
      track.addEventListener('ended', () => {
        if (stream.current !== feed) return;
        setReady(false);
        setError('Camera disconnected. Re-enable it to continue.');
      });
      track.addEventListener('mute', () => {
        if (stream.current === feed) setReady(false);
      });
      track.addEventListener('unmute', () => {
        if (stream.current === feed && !preview.paused) setReady(true);
      });
      preview.srcObject = feed;
      await preview.play();
      if (request === currentRequest.current && track.readyState === 'live' && !track.muted) {
        setReady(true);
      }
    } catch {
      if (request === currentRequest.current) {
        setError('Camera unavailable. Check browser permissions and try again.');
        stream.current?.getTracks().forEach((track) => track.stop());
        stream.current = null;
        preview.srcObject = null;
      }
    } finally {
      if (request === currentRequest.current) {
        busy.current = false;
        setPending(false);
      }
    }
  }

  return { video, ready, pending, error, enable, isQnx, streamUrl: QNX_STREAM_URL };
}
