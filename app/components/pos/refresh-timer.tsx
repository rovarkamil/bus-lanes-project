import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export const RefreshTimer = () => {
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 1 hour in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const getColorClass = () => {
    const halfTime = 30 * 60; // 30 minutes
    const tenMinutes = 10 * 60; // 10 minutes

    if (timeLeft <= tenMinutes)
      return "bg-primary/10 text-primary border-primary/50 animate-pulse";
    if (timeLeft <= halfTime)
      return "bg-primary/10 text-primary border-primary/50";
    return "bg-primary/5 text-primary border-primary/20";
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getColorClass()} transition-all duration-300`}
    >
      <Clock className="w-4 h-4" />
      <div className="font-mono font-medium">{timeString}</div>
    </div>
  );
};
