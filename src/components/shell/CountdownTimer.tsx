"use client";

import { useEffect, useState } from "react";

/**
 * Returns the target date for next Friday at 5 PM EST.
 */
function getNextFriday5PM() {
  const now = new Date();
  const target = new Date();
  
  // Calculate days until next Friday (Friday is day 5)
  let daysUntilFriday = 5 - now.getDay();
  // If today is Friday after 5 PM, or Saturday, target NEXT week's Friday.
  if (daysUntilFriday < 0 || (daysUntilFriday === 0 && now.getHours() >= 17)) {
    daysUntilFriday += 7;
  }
  
  target.setDate(now.getDate() + daysUntilFriday);
  target.setHours(17, 0, 0, 0);
  
  return target.getTime();
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");

  useEffect(() => {
    const targetTime = getNextFriday5PM();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Format as DD:HH:MM:SS or HH:MM:SS
      const parts = [];
      if (days > 0) parts.push(days.toString().padStart(2, "0"));
      parts.push(hours.toString().padStart(2, "0"));
      parts.push(minutes.toString().padStart(2, "0"));
      parts.push(seconds.toString().padStart(2, "0"));

      setTimeLeft(parts.join(":"));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-[#004f54]/20 border border-focus/30 px-3 py-1.5 rounded font-mono text-[11px] font-bold text-focus uppercase tracking-wider">
      <span>TIME_REMAINING:</span>
      <span className="tabular-nums min-w-[64px]">{timeLeft}</span>
    </div>
  );
}
