import { useQuery } from "@tanstack/react-query";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TaskCard } from "@/components/TaskCard";
import { TaskStats } from "@/components/TaskStats";
import { TaskFilters, filterAndGroupTasks } from "@/components/TaskFilters";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { SelectTask } from "@db/schema";
import { Loader2 } from "lucide-react";
import { useState } from "react";

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const taskGroups = tasks ? filterAndGroupTasks(tasks, filters) : [];

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Task Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.username}</p>
        </div>
        <div className="flex gap-4">
          <CreateTaskDialog />
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {tasks && <TaskStats tasks={tasks} />}
        </div>
        <div>
          <PomodoroTimer />
        </div>
      </div>

      <TaskFilters filters={filters} onFilterChange={setFilters} />

      <div className="space-y-8">
        {taskGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-xl font-semibold mb-4">{group.title}</h2>
            {group.tasks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No tasks in this group
              </div>
            )}
          </div>
        ))}
        {taskGroups.every((group) => group.tasks.length === 0) && (
          <div className="text-center text-muted-foreground py-8">
            No tasks match the selected filters
          </div>
        )}
      </div>
    </div>
  );
}