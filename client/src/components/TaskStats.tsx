import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectTask } from "@db/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { CheckCircle2, Clock, Target } from "lucide-react";

type TaskStatsProps = {
  tasks: SelectTask[];
};

export function TaskStats({ tasks }: TaskStatsProps) {
  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate priority distribution
  const priorityCount = tasks.reduce(
    (acc, task) => {
      acc[task.priority as keyof typeof acc] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  const priorityData = Object.entries(priorityCount).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = {
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#22c55e",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTasks}</div>
          <p className="text-xs text-muted-foreground">
            {completedTasks} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Of all tasks completed
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-full md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Priority Distribution</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name as keyof typeof COLORS]}
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}