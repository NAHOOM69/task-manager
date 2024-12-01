import React from 'react';
import { Task } from '@/types/task';  // נייבא את הטיפוס Task
import { CheckCircle, Edit2, Trash2, Calendar, Bell, Building2, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { formatDateForDevice, formatDateTimeForDevice } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: number) => void;
  onEdit: () => void;
  onDelete: (id: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleComplete, onEdit, onDelete }) => {
  const isOverdue = !task.completed && new Date(task.dueDate) < new Date();

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow
      ${task.type === 'hearing' ? 'border-r-4 border-blue-500' : ''}
      ${isOverdue ? 'border border-red-500' : ''}`}>
      {/* ... תוכן הקומפוננטה ... */}
    </div>
  );
};

export default TaskCard;