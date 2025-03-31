import { useRef, useState } from "react";

export const TimerComponent = () => {
  const [whiteTimer, setWhiteTimer] = useState<number>(300); // 5 minutes for white
  const [blackTimer, setBlackTimer] = useState<number>(300); // 5 minutes for black
  const timerInterval = useRef<number | null>(null);
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };
  const startTimer = (currentPlayerColor: "white" | "black") => {
    stopTimer(); // Clear any existing timer

    timerInterval.current = setInterval(() => {
      if (currentPlayerColor === "white") {
        setWhiteTimer((prevTime) => {
          if (prevTime <= 0) {
            stopTimer();
            console.log("Black wins on time!");
            return 0;
          }
          return prevTime - 1;
        });
      } else {
        setBlackTimer((prevTime) => {
          if (prevTime <= 0) {
            stopTimer();
            console.log("White wins on time!");
            return 0;
          }
          return prevTime - 1;
        });
      }
    }, 1000) as any;
  };

  const stopTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };

    return (
      <div className="flex justify-around w-full mb-6">
      <div className="text-center">
        <p className="text-gray-600">White</p>
        <div className="font-bold text-lg">
          {
            formatTime(whiteTimer)
          }
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-600">Black</p>
        <div className="font-bold text-lg">
          {
            formatTime(blackTimer)
          }
        </div>
      </div>
    </div>
    )
}