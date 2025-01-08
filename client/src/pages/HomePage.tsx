import { useQuery } from "@tanstack/react-query";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TaskStats } from "@/components/TaskStats";
import { TaskFilters, filterAndGroupTasks, type FilterOptions } from "@/components/TaskFilters";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { SelectTask } from "@db/schema";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SortableTaskList } from "@/components/SortableTaskList";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function HomePage() {
  const { user, logout } = useUser();
  const [filters, setFilters] = useState<FilterOptions>({
    priority: null,
    showCompleted: true,
    groupBy: null,
  });

  const { data: tasks, isLoading } = useQuery<SelectTask[]>({
    queryKey: ["/api/tasks"],
  });

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const taskGroups = tasks ? filterAndGroupTasks(tasks, filters) : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-2xl font-medium mb-1">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user?.displayName || 'User'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <CreateTaskDialog />
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-8 grid-cols-1 lg:grid-cols-4"
        >
          <div className="lg:col-span-3">
            {tasks && <TaskStats tasks={tasks} />}
          </div>
          <div>
            <PomodoroTimer />
          </div>
        </motion.div>

        <TaskFilters filters={filters} onFilterChange={setFilters} />

        <AnimatePresence mode="wait">
          <motion.div 
            key={`${filters.groupBy}-${filters.priority}-${filters.showCompleted}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {taskGroups.map((group) => (
              <motion.div 
                key={group.title}
                variants={container}
                initial="hidden"
                animate="show"
              >
                <SortableTaskList tasks={group.tasks} groupTitle={group.title} />
              </motion.div>
            ))}
            {taskGroups.every((group) => group.tasks.length === 0) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-8 bg-card rounded-lg"
              >
                No tasks match the selected filters
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}