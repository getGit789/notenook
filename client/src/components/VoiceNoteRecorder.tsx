import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type VoiceNoteRecorderProps = {
  onRecordingComplete: (audioBlob: Blob) => void;
  currentVoiceNote?: string;
};

export function VoiceNoteRecorder({ onRecordingComplete, currentVoiceNote }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const { toast } = useToast();

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const timerInterval = useRef<NodeJS.Timeout>();

  // Initialize audio player
  useEffect(() => {
    if (currentVoiceNote && !audioPlayer.current) {
      const audio = new Audio();
      audio.src = currentVoiceNote;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load voice note. Please try again.",
        });
        setIsPlaying(false);
      };
      audioPlayer.current = audio;
    }
  }, [currentVoiceNote, toast]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        onRecordingComplete(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerInterval.current = setInterval(() => {
        setRecordingTime(time => time + 1);
      }, 1000);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access microphone. Please ensure microphone permissions are granted.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      clearInterval(timerInterval.current);
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (!currentVoiceNote || !audioPlayer.current) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Voice note not available for playback.",
      });
      return;
    }

    try {
      if (isPlaying) {
        audioPlayer.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayer.current.play().catch(error => {
          console.error('Playback error:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to play voice note. Please try again.",
          });
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to play voice note. Please try again.",
      });
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (audioPlayer.current) {
        audioPlayer.current.pause();
        audioPlayer.current = null;
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {currentVoiceNote ? (
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayback}
          className="h-8 w-8"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      ) : null}

      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ opacity: [1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-red-500"
            />
            <span className="text-sm text-muted-foreground">
              {formatTime(recordingTime)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        variant="outline"
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        className="h-8 w-8"
      >
        {isRecording ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}