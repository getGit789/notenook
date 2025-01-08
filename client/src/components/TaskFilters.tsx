import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SelectTask } from "@db/schema";

export type FilterOptions = {
  priority: string | null;
  showCompleted: boolean;
  groupBy: string | null;
};

type TaskFiltersProps = {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
};

export function TaskFilters({ filters, onFilterChange }: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 py-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="priority-filter">Priority</Label>
        <Select
          value={filters.priority ?? "all"}
          onValueChange={(value) =>
            onFilterChange({
              ...filters,
              priority: value === "all" ? null : value,
            })
          }
        >
          <SelectTrigger className="w-[150px]" id="priority-filter">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="show-completed">Show Completed</Label>
        <Switch
          id="show-completed"
          checked={filters.showCompleted}
          onCheckedChange={(checked) =>
            onFilterChange({ ...filters, showCompleted: checked })
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="group-by">Group By</Label>
        <Select
          value={filters.groupBy ?? "none"}
          onValueChange={(value) =>
            onFilterChange({
              ...filters,
              groupBy: value === "none" ? null : value,
            })
          }
        >
          <SelectTrigger className="w-[150px]" id="group-by">
            <SelectValue placeholder="Group tasks by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function filterAndGroupTasks(
  tasks: SelectTask[],
  filters: FilterOptions
): { title: string; tasks: SelectTask[] }[] {
  let filteredTasks = [...tasks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  filteredTasks = filteredTasks.filter((task) => {
    if (!filters.showCompleted && task.completed) {
      return false;
    }
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    return true;
  });

  if (!filters.groupBy) {
    return [{ title: "All Tasks", tasks: filteredTasks }];
  }

  if (filters.groupBy === "priority") {
    const groups = ["high", "medium", "low"];
    return groups.map((priority) => ({
      title: `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`,
      tasks: filteredTasks.filter((task) => task.priority === priority),
    }));
  }

  if (filters.groupBy === "status") {
    return [
      {
        title: "In Progress",
        tasks: filteredTasks.filter((task) => !task.completed),
      },
      {
        title: "Completed",
        tasks: filteredTasks.filter((task) => task.completed),
      },
    ];
  }

  return [{ title: "All Tasks", tasks: filteredTasks }];
}