import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectTask } from "@db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";

type TaskCardProps = {
  task: SelectTask;
};

const priorityColors = {
  low: "bg-[hsl(var(--priority-low-gradient))] shadow-[hsl(var(--priority-low))]",
  medium: "bg-[hsl(var(--priority-medium-gradient))] shadow-[hsl(var(--priority-medium))]",
  high: "bg-[hsl(var(--priority-high-gradient))] shadow-[hsl(var(--priority-high))]",
};

const priorityRings = {
  low: "ring-[hsl(var(--priority-low))]",
  medium: "ring-[hsl(var(--priority-medium))]",
  high: "ring-[hsl(var(--priority-high))]",
};

export function TaskCard({ task }: TaskCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateTask = useMutation({
    mutationFn: async (data: Partial<SelectTask>) => {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleVoiceNoteComplete = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('voiceNote', audioBlob, 'voice-note.wav');

    try {
      const response = await fetch(`/api/tasks/${task.id}/voice-note`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updatedTask = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      toast({
        title: "Success",
        description: "Voice note added successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload voice note",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`
          ${task.completed ? "opacity-60" : ""} 
          ring-1 ring-inset ${priorityRings[task.priority as keyof typeof priorityRings]} 
          transition-shadow duration-200 hover:ring-2
          ${task.priority === 'high' ? 'animate-pulse' : ''}
        `}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) =>
                    updateTask.mutate({ completed: checked === true })
                  }
                />
              </motion.div>
              <motion.span
                animate={{
                  textDecoration: task.completed ? "line-through" : "none",
                  opacity: task.completed ? 0.6 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {task.title}
              </motion.span>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                className={`
                  ${priorityColors[task.priority as keyof typeof priorityColors]} 
                  shadow-sm font-semibold
                `}
              >
                {task.priority}
              </Badge>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTask.mutate()}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent>
          <motion.p
            initial={false}
            animate={{ opacity: task.completed ? 0.6 : 1 }}
            className="text-sm text-muted-foreground"
          >
            {task.description}
          </motion.p>
          {task.deadline && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground mt-2"
            >
              Due: {new Date(task.deadline).toLocaleDateString()}
            </motion.p>
          )}
          <div className="mt-4">
            <VoiceNoteRecorder 
              onRecordingComplete={handleVoiceNoteComplete}
              currentVoiceNote={task.voiceNote}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}