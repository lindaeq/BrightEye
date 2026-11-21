import { useEffect, useRef, useState } from 'react';

export function useCameraFeed() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const currentRequest = useRef(0);
  const busy = useRef(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => {
    currentRequest.current++;
    stream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function enable() {
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
      if (request === currentRequest.current && track.readyState === 'live' && !track.muted) setReady(true);
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

  return { video, ready, pending, error, enable };
}
