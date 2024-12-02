import React from 'react';
import { Task } from '@/types/task';
import { Edit2, Trash2, CheckCircle, Bell, Calendar } from 'lucide-react';
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

const getDaysLeft = (dateString: string) => {
  try {
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'היום';
    if (diffDays === 1) return 'מחר';
    if (diffDays === -1) return 'אתמול';
    
    return diffDays > 0 ? 
      `עוד ${diffDays} ימים` : 
      `${Math.abs(diffDays)} ימים באיחור`;
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

  const exportToCalendar = () => {
    const startDate = task.courtDate || task.dueDate;
    const endDate = new Date(new Date(startDate).getTime() + 60 * 60 * 1000); // Add 1 hour

    const description = [
      task.clientName,
      task.court ? `בית משפט: ${task.court}` : '',
      task.judge ? `שופט: ${task.judge}` : ''
    ].filter(Boolean).join('\\n');

    const event = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${new Date(startDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:${task.taskName}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([event], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${task.taskName}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <span className="flex items-center gap-2">
                  תאריך יעד: {formatDate(task.dueDate)}
                  <span className={cn(
                    "font-medium",
                    new Date(task.dueDate) < new Date() ? "text-red-500" : "text-green-500"
                  )}>
                    ({getDaysLeft(task.dueDate)})
                  </span>
                </span>
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
            onClick={exportToCalendar}
            title="הוסף ליומן"
          >
            <Calendar className="text-orange-500" />
          </Button>
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