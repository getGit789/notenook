import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bell, Pause, Play, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WORK_MINUTES = 25;
const SHORT_BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;
const POMODOROS_UNTIL_LONG_BREAK = 4;

type TimerState = "work" | "short-break" | "long-break";

export function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(WORK_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>("work");
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const { toast } = useToast();

  const totalTime = useCallback(() => {
    switch (timerState) {
      case "work":
        return WORK_MINUTES * 60;
      case "short-break":
        return SHORT_BREAK_MINUTES * 60;
      case "long-break":
        return LONG_BREAK_MINUTES * 60;
    }
  }, [timerState]);

  const progress = Math.round((timeLeft / totalTime()) * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTimerComplete = useCallback(() => {
    let nextState: TimerState;
    let message: string;

    if (timerState === "work") {
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);

      if (newCompletedPomodoros % POMODOROS_UNTIL_LONG_BREAK === 0) {
        nextState = "long-break";
        message = "Time for a long break!";
      } else {
        nextState = "short-break";
        message = "Time for a short break!";
      }
    } else {
      nextState = "work";
      message = "Break's over! Time to focus.";
    }

    setTimerState(nextState);
    setTimeLeft(totalTime());
    setIsRunning(false);

    toast({
      title: "Timer Complete",
      description: message,
    });
  }, [timerState, completedPomodoros, toast, totalTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleTimerComplete]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalTime());
  };

  return (
    <Card>
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Pomodoro Timer
          {completedPomodoros > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              {completedPomodoros} completed
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold tracking-tighter">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-muted-foreground capitalize">
              {timerState.replace("-", " ")}
            </div>
          </div>

          <Progress value={progress} className="h-2" />

          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTimer}
              className="h-8 w-8"
            >
              {isRunning ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={resetTimer}
              className="h-8 w-8"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
