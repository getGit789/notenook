import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectTask } from "@db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";

type TaskCardProps = {
  task: SelectTask;
};

const priorityColors = {
  low: "priority-low",
  medium: "priority-medium",
  high: "priority-high",
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
      <Card className={`${task.completed ? "opacity-60" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={task.completed || false}
                onCheckedChange={(checked) =>
                  updateTask.mutate({ completed: checked === true })
                }
              />
              <span className={task.completed ? "line-through opacity-60" : ""}>
                {task.title}
              </span>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${priorityColors[task.priority as keyof typeof priorityColors]} px-3 py-1`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteTask.mutate()}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-sm text-muted-foreground ${task.completed ? "opacity-60" : ""}`}>
            {task.description}
          </p>
          {task.deadline && (
            <p className="text-xs text-muted-foreground mt-2">
              Due: {new Date(task.deadline).toLocaleDateString()}
            </p>
          )}
          <div className="mt-4">
            <VoiceNoteRecorder
              onRecordingComplete={handleVoiceNoteComplete}
              currentVoiceNote={task.voiceNote || undefined}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}