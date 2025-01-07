import { useQuery } from "@tanstack/react-query";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TaskCard } from "@/components/TaskCard";
import { TaskStats } from "@/components/TaskStats";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { SelectTask } from "@db/schema";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, logout } = useUser();

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

      {tasks && <TaskStats tasks={tasks} />}

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks?.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {tasks?.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">
              No tasks yet. Create your first task to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}