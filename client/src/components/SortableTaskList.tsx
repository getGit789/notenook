import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { SelectTask } from "@db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type SortableTaskListProps = {
  tasks: SelectTask[];
  groupTitle: string;
};

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

function SortableTaskItem({ task }: { task: SelectTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isDragging ? 0.5 : 1,
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging 
          ? "0 8px 16px rgba(0,0,0,0.1)" 
          : "0 2px 4px rgba(0,0,0,0.05)"
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        layout: { type: "spring", damping: 20, stiffness: 300 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
    </motion.div>
  );
}

export function SortableTaskList({ tasks, groupTitle }: SortableTaskListProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const activeTask = tasks.find(task => task.id === activeId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const queryClient = useQueryClient();

  const updateTaskOrder = useMutation({
    mutationFn: async (taskIds: number[]) => {
      const response = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskIds }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task order updated",
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      const newTasks = [...tasks];
      const [movedTask] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, movedTask);

      updateTaskOrder.mutate(newTasks.map((task) => task.id));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-semibold mb-4">{groupTitle}</h2>
      {tasks.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <motion.div
              layout
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {tasks.map((task) => (
                  <SortableTaskItem key={task.id} task={task} />
                ))}
              </AnimatePresence>
            </motion.div>
          </SortableContext>
          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? (
              <motion.div
                initial={{ scale: 1.05 }}
                animate={{ scale: 1.05 }}
                className="cursor-grabbing"
              >
                <TaskCard task={activeTask} />
              </motion.div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground py-8 bg-card rounded-lg"
        >
          No tasks in this group
        </motion.div>
      )}
    </motion.div>
  );
}