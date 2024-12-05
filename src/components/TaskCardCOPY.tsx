import React from 'react';
import { Task } from '@/Types/Task';
import { Edit2, Trash2, CheckCircle, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
  task: Task;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return format(date, 'dd/MM/yyyy', { locale: he });
  } catch {
    return '';
  }
};

const formatDateTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return format(date, "dd/MM/yyyy HH:mm", { locale: he });
  } catch {
    return '';
  }
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete
}) => {
  const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
  const taskNameLower = task.taskName.toLowerCase();
  
  const getBorderColor = () => {
    if (taskNameLower.includes('דיון הוכחות')) {
      return 'border-blue-600';
    }
    if (taskNameLower.includes('דיון') || 
        taskNameLower.includes('קדם דיון') || 
        taskNameLower.includes('דיון קדם')) {
      return 'border-sky-300';
    }
    if (isOverdue && !task.completed) {
      return 'border-red-300';
    }
    return 'border-gray-200';
  };

  return (
    <div className={cn(
      "border-2 rounded-lg p-4 relative",
      task.completed ? "bg-gray-50" : "bg-white",
      getBorderColor()
    )}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{task.clientName}</h3>
          <p className="text-gray-600">{task.taskName}</p>
          
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-500">
              {task.dueDate && (
                <span>תאריך יעד: {formatDate(task.dueDate)}</span>
              )}
            </p>
            {task.reminderDate && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Bell size={14} className="text-blue-500" />
                תזכורת: {formatDateTime(task.reminderDate)}
              </p>
            )}
            {task.courtDate && (
              <p className="text-sm text-gray-500">
                תאריך דיון: {formatDateTime(task.courtDate)}
              </p>
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