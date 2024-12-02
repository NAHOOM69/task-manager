import React from 'react';
import { Task } from '@/types/task';
import { Edit2, Trash2, CheckCircle } from 'lucide-react';
import { formatDateForDevice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
  task: Task;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete
}) => {
  const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <div className={cn(
      "border rounded-lg p-4 relative",
      task.completed ? "bg-gray-50" : "bg-white",
      isOverdue && !task.completed ? "border-red-300" : "border-gray-200"
    )}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          {/* שם הלקוח כותרת ראשית */}
          <h3 className="font-semibold text-lg mb-1">{task.clientName}</h3>
          {/* שם המשימה מתחת */}
          <p className="text-gray-600">{task.taskName}</p>
          
          <div className="mt-2 text-sm text-gray-500">
            <p>תאריך יעד: {formatDateForDevice(task.dueDate)}</p>
            {task.courtDate && (
              <p>תאריך דיון: {formatDateForDevice(task.courtDate)}</p>
            )}
          </div>
          {task.court && (
            <p className="text-sm text-gray-600 mt-1">
              {task.court} {task.judge ? `- ${task.judge}` : ''}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleComplete}
            title={task.completed ? 'סמן כלא הושלם' : 'סמן כהושלם'}
          >
            <CheckCircle
              className={cn(
                "transition-colors",
                task.completed ? "text-green-500" : "text-gray-300"
              )}
            />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onEdit}
            title="ערוך משימה"
          >
            <Edit2 className="text-blue-500" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            title="מחק משימה"
          >
            <Trash2 className="text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;