import { useEffect, useRef, useState } from 'react';
import { missionSeconds } from './missionGames';

export function useMissionClock(onFinish: () => void) {
  const [timeLeft, setTimeLeft] = useState(missionSeconds);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const deadline = useRef(0);
  const endEarly = useRef(() => {});

  useEffect(() => {
    deadline.current = performance.now() + missionSeconds * 1000;
    const countdown = window.setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000)));
    }, 100);
    function end() {
      if (deadline.current === 0) return;
      deadline.current = 0;
      window.clearInterval(countdown);
      window.clearTimeout(timeout);
      setTimeLeft(0);
      finish.current();
    }
    const timeout = window.setTimeout(end, missionSeconds * 1000);
    endEarly.current = end;
    return () => {
      deadline.current = 0;
      window.clearTimeout(timeout);
      window.clearInterval(countdown);
    };
  }, []);

  return { timeLeft, deadline, endEarly };
}
