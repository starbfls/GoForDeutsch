import { useEffect, useState } from "react";
export const blinkDelay = (random = Math.random) => 3200 + random() * 5000;
export default function useMiaBlink(enabled) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    const timers = new Set();
    let active = true;
    let motion = localStorage.getItem("gfd-motion") !== "off";
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const later = (callback, delay) => {
      const id = setTimeout(() => {
        timers.delete(id);
        if (active) callback();
      }, delay);
      timers.add(id);
    };
    const clear = () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
    const schedule = () => {
      if (!enabled || !motion || media.matches || document.hidden) return;
      later(() => {
        setClosed(true);
        later(() => {
          setClosed(false);
          schedule();
        }, 130);
      }, blinkDelay());
    };
    const restart = () => {
      clear();
      later(() => {
        setClosed(false);
        schedule();
      }, 0);
    };
    const change = (event) => {
      motion = event.detail;
      restart();
    };
    restart();
    window.addEventListener("gfd-motion-change", change);
    document.addEventListener("visibilitychange", restart);
    media.addEventListener("change", restart);
    return () => {
      active = false;
      clear();
      window.removeEventListener("gfd-motion-change", change);
      document.removeEventListener("visibilitychange", restart);
      media.removeEventListener("change", restart);
    };
  }, [enabled]);
  return enabled && closed;
}
