// TaskCard.tsx
import React from 'react';
import { Task } from '@/types/task';
import { CheckCircle, Edit2, Trash2, Calendar, Bell, Building2, User } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface TaskCardProps {
  task: Task;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleComplete, onEdit, onDelete }) => {
  const isOverdue = !task.completed && new Date(task.dueDate) < new Date();
  
  console.log('Rendering task:', task); // Debug log

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 mb-4 ${task.completed ? 'opacity-70' : ''} 
      ${task.type === 'hearing' ? 'border-r-4 border-blue-500' : ''}
      ${isOverdue ? 'border border-red-500' : ''}`}>
      
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{task.taskName}</h3>
          <p className="text-gray-600 mb-2">{task.clientName}</p>
          
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Calendar className="h-4 w-4 ml-1" />
            {new Date(task.dueDate).toLocaleDateString('he-IL')}
          </div>
          
          {task.type === 'hearing' && (
            <div className="mt-2 p-2 bg-gray-50 rounded">
              {task.court && (
                <div className="flex items-center mb-1">
                  <Building2 className="h-4 w-4 ml-1" />
                  <span>{task.court}</span>
                </div>
              )}
              {task.judge && (
                <div className="flex items-center mb-1">
                  <User className="h-4 w-4 ml-1" />
                  <span>{task.judge}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggleComplete}
            className={task.completed ? 'text-green-500' : 'text-gray-400'}
          >
            <CheckCircle className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
          >
            <Edit2 className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-red-500"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;