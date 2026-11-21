import { useEffect, useRef, useState } from 'react';
import { missionSeconds } from './missionGames';

export function useMissionClock(onFinish: () => void) {
  const [timeLeft, setTimeLeft] = useState(missionSeconds);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const deadline = useRef(0);

  useEffect(() => {
    deadline.current = performance.now() + missionSeconds * 1000;
    const countdown = window.setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000)));
    }, 100);
    const timeout = window.setTimeout(() => {
      window.clearInterval(countdown);
      setTimeLeft(0);
      finish.current();
    }, missionSeconds * 1000);
    return () => {
      deadline.current = 0;
      window.clearTimeout(timeout);
      window.clearInterval(countdown);
    };
  }, []);

  return { timeLeft, deadline };
}
