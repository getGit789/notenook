import { useQuery } from "@tanstack/react-query";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TaskCard } from "@/components/TaskCard";
import { TaskStats } from "@/components/TaskStats";
import { TaskFilters, filterAndGroupTasks } from "@/components/TaskFilters";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { SelectTask } from "@db/schema";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const listItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function HomePage() {
  const { user, logout } = useUser();
  const [filters, setFilters] = useState({
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
            <h1 className="text-3xl font-bold">Task Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.username}</p>
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
            key={filters.groupBy + filters.priority + filters.showCompleted.toString()}
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
                <h2 className="text-xl font-semibold mb-4">{group.title}</h2>
                {group.tasks.length > 0 ? (
                  <motion.div 
                    className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                    variants={container}
                    initial="hidden"
                    animate="show"
                    layout
                  >
                    <AnimatePresence mode="popLayout">
                      {group.tasks.map((task) => (
                        <motion.div
                          key={task.id}
                          variants={listItem}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: "spring", damping: 15 }}
                        >
                          <TaskCard task={task} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
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