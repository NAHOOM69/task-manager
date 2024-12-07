'use client';

import React, { useState, useEffect } from 'react';

import TaskFormDialog from './TaskFormDialog';

import type { Case } from '@/Types/Case';
import { Task, TaskType, TaskInput } from '@/Types/Task';
import { 
  Plus,
  Trash2, 
  Edit2, 
  CheckCircle,
  Calendar,
  Bell,
  Search,
  Building2,
  User,
  RotateCcw,
  Loader2,
  X,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { firebaseService } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface TaskFormProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskInput) => Promise<void>;
}

interface TaskCardProps {
  task: Task;
}

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState<'add' | 'edit'>('add');

  useEffect(() => {
    setIsLoading(true);
  
    try {
      const unsubscribeTasks = firebaseService.onTasksChange((updatedTasks) => {
        setTasks(updatedTasks);
        setIsLoading(false);
      });
  
      const unsubscribeCases = firebaseService.onCasesChange((updatedCases) => {
        setCases(updatedCases);
      });
  
      return () => {
        unsubscribeTasks();
        unsubscribeCases();
      };
    } catch (error: any) {
      setError(`אירעה שגיאה כללית: ${error.message}`);
      setIsLoading(false);
    }
  }, []);
  
  
  
  const handleAddTask = async (taskData: TaskInput) => {
    if (!taskData.clientName || !taskData.taskName || !taskData.dueDate) {
      setError('יש למלא את כל שדות החובה');
      return;
    }

    try {
      setIsLoading(true);
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),  // במקום רק Date.now()
        completed: false,
        notified: false
      };
      await firebaseService.saveTask(newTask);
      setIsFormOpen(false);
    } catch (error) {
      setError('אירעה שגיאה בשמירת המשימה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (taskData: TaskInput) => {
    if (!selectedTask) return;
  
    try {
      setIsLoading(true);
      const updatedTask: Task = {
        ...selectedTask,
        ...taskData,
      };
  
      // יש לוודא שמועברים שני פרמטרים: מזהה המשימה והמידע המעודכן
      await firebaseService.updateTask(String(selectedTask.id), updatedTask);

  
      setSelectedTask(null);
      setIsFormOpen(false);
    } catch (error) {
      setError('אירעה שגיאה בעדכון המשימה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleDeleteTask = async (id: string) => {  // מקבל string
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) return;
    
    try {
      setIsLoading(true);
      await firebaseService.deleteTask(id);  // מעביר את ה-string כמו שהוא
    } catch (error) {
      setError('אירעה שגיאה במחיקת המשימה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
  
    try {
      setIsLoading(true);
      const newStatus = !task.completed;
      await firebaseService.updateTaskStatus(id, newStatus);
    } catch (error) {
      setError("אירעה שגיאה ב" + (task.completed ? "ביטול" : "סימון") + " המשימה כהושלמה.");
    } finally {
      setIsLoading(false);
    }
  };

  const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    const relatedCase = task.caseId ? cases.find(c => c.id === task.caseId) : null;

    return (
      <div className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow ${
        task.type === TaskType.HEARING ? 'border-r-4 border-blue-500' : ''
      }`}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1 truncate">{task.clientName}</h3>
            <p className="text-gray-600 mb-2">{task.taskName}</p>
            
            {relatedCase && (
              <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                <FolderOpen width={16} height={16} />
                <span>תיק: {relatedCase.caseNumber}</span>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
              <Calendar width={16} height={16} />
                <span>{new Date(task.dueDate).toLocaleDateString('he-IL')}</span>
              </div>
              {task.reminderDate && (
                <div className="flex items-center gap-1">
                  <Bell width={16} height={16} />
                  <span>
                    {new Date(task.reminderDate).toLocaleDateString('he-IL', {
                      hour: 'numeric',
                      minute: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            {task.type === TaskType.HEARING && (
              <div className="mt-3 p-2 bg-gray-50 rounded-lg text-sm space-y-2">
                {task.courtDate && (
                  <div className="flex items-center gap-2">
                    <Calendar width={16} height={16} className="text-blue-500" />
                    <span>דיון: {new Date(task.courtDate).toLocaleDateString('he-IL', {
                      hour: 'numeric',
                      minute: 'numeric'
                    })}</span>
                  </div>
                )}
                {task.court && (
                  <div className="flex items-center gap-2">
                    <Building2 width={16} height={16}    className="text-blue-500" />
                    <span>בימ"ש: {task.court}</span>
                  </div>
                )}
                {task.judge && (
                  <div className="flex items-center gap-2">
                    <User width={16} height={16} className="text-blue-500" />
                    <span>השופט: {task.judge}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleComplete(task.id)}
              title={task.completed ? 'החזר למשימות פעילות' : 'סמן כהושלם'}
            >
              {task.completed ? (
                <RotateCcw width={16} height={16} className="text-blue-500" />
              ) : (
                <CheckCircle width={20} height={20} className="text-gray-400 hover:text-green-500" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedTask(task);
                setFormType('edit');
                setIsFormOpen(true);
              }}
              title="ערוך משימה"
            >
              <Edit2 width={20} height={20} className="text-gray-400 hover:text-blue-500" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteTask(task.id)} 
              title="מחק משימה"
            >
              <Trash2 width={20} height={20} className="text-gray-400 hover:text-red-500" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const filteredTasks = tasks
    .filter(task => {
      if (searchQuery === '') return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        task.taskName.toLowerCase().includes(searchLower) || 
        task.clientName.toLowerCase().includes(searchLower) ||
        (task.court && task.court.toLowerCase().includes(searchLower)) ||
        (task.judge && task.judge.toLowerCase().includes(searchLower))
      );
    })
    .filter(task => activeTab === 'completed' ? task.completed : !task.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-center">מנהל משימות</h1>
      
      <div className="mb-4 flex gap-4 items-center justify-between">
        <div className="relative flex-1">
          <Input
            placeholder="חיפוש משימות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-2.5 text-gray-400" width={20} height={20}/>
        </div>
        <Button
          onClick={() => {
            setSelectedTask(null);
            setFormType('add');
            setIsFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus width={20} height={20} />
          <span className="hidden sm:inline">הוסף משימה</span>
        </Button>
      </div>

      <div className="flex mb-6 gap-2">
        <Button
          variant={activeTab === 'active' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('active')}
          className="flex-1"
        >
          משימות פעילות
        </Button>
        <Button
          variant={activeTab === 'completed' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('completed')}
          className="flex-1"
        >
          משימות שהושלמו
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex justify-between items-center">
            {error}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setError(null)}
              className="h-auto p-0"
            >
              <X width={18} height={18} />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-500" width={32} height={32} />
          </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          {searchQuery ? 'לא נמצאו משימות התואמות את החיפוש' : 'אין משימות להצגה'}
        </div>
      )}

{isFormOpen && (
  <TaskFormDialog
    initialTask={selectedTask}
    open={isFormOpen}
    onOpenChange={(open) => {
      setIsFormOpen(open);
      if (!open) setSelectedTask(null);
    }}
    onSubmit={selectedTask ? handleUpdateTask : handleAddTask}
    cases={cases}
  />
)}
```
   </div>
  );
};

export default TaskManager;