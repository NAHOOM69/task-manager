'use client';

import { Task, TaskInput, TaskType } from '@/types/task';
import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, CheckCircle, Calendar, Bell, Search,
  Building2, User, RotateCcw, Loader2, X, AlertCircle, Save, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { firebaseService } from '@/lib/firebase';
import { NotificationService } from '@/lib/notifications';
import { cleanTaskForFirebase, validateTask } from '@/lib/taskHelpers';

// Components
import TaskCard from '@/components/TaskCard';
import TaskFormDialog from '@/components/TaskFormDialog';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Date formatting utilities
function formatDateForDevice(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString.replace(/-/g, '/'));
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return format(date, 'dd/MM/yyyy', { locale: he });
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
}

const formatDateTimeForDevice = (dateString: string): string => {
  try {
    const date = new Date(dateString.replace(/-/g, '/'));
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return format(date, 'dd/MM/yyyy HH:mm', { locale: he });
  } catch (error) {
    console.error('Date/time formatting error:', error);
    return dateString;
  }
};

const TaskManager: React.FC = () => {
  // State declarations
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState<'add' | 'edit'>('add');
  const [isError, setIsError] = useState(false);

  // Initialize Notifications
  useEffect(() => {
    const initApp = async () => {
      try {
        const notificationService = NotificationService.getInstance();
        await notificationService.init();
        await notificationService.requestPermission();
      } catch (error) {
        console.error('Notifications initialization failed:', error);
      }
    };
    void initApp();
  }, []);

  // Firebase Connection
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      setError(null);
      console.log('Initializing Firebase connection...');

      try {
        for (let i = 0; i < 3; i++) {
          try {
            console.log(`Connection attempt ${i + 1}/3`);
            await firebaseService.testConnection();
            console.log('Firebase connected successfully');
            break;
          } catch (error) {
            console.warn(`Connection attempt ${i + 1} failed:`, error);
            if (i === 2) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const unsubscribe = firebaseService.onTasksChange(
          (updatedTasks) => {
            console.log(`Received ${updatedTasks.length} tasks`);
            setTasks(updatedTasks);
            setIsLoading(false);
            setError(null);
          },
          (error) => {
            console.error('Firebase error:', error);
            setError('אירעה שגיאה בטעינת המשימות');
            setIsLoading(false);
          }
        );

        return () => {
          console.log('Cleaning up Firebase subscription');
          unsubscribe();
        };
      } catch (error) {
        console.error('Firebase initialization failed:', error);
        setError('אין חיבור לשרת');
        setIsLoading(false);
      }
    };

    void initializeApp();
  }, []);

  // Check Reminders
  useEffect(() => {
    const notificationService = NotificationService.getInstance();
    
    const checkReminders = async () => {
      const now = new Date();
      for (const task of tasks) {
        try {
          if (task.reminderDate && !task.notified && !task.completed && 
              new Date(task.reminderDate) <= now) {
            await notificationService.sendImmediateNotification(task);
            await firebaseService.updateTask({
              ...task,
              notified: true
            });
          }
        } catch (error) {
          console.error('Reminder check failed for task:', task.id, error);
        }
      }
    };

    const interval = setInterval(() => void checkReminders(), 60000);
    void checkReminders();
    return () => clearInterval(interval);
  }, [tasks]);

  // Task Management Functions
  const handleAddTask = async (taskData: Partial<Task>) => {
    try {
      setIsLoading(true);
      setError(null);

      const cleanedTask = cleanTaskForFirebase(taskData);
      validateTask(cleanedTask);

      await firebaseService.saveTask(cleanedTask);
      
      if (cleanedTask.reminderDate) {
        const notificationService = NotificationService.getInstance();
        await notificationService.scheduleTaskReminder(cleanedTask);
      }
      
      setIsFormOpen(false);
    } catch (error) {
      console.error('Add task error:', error);
      setError(error instanceof Error ? error.message : 'אירעה שגיאה בשמירת המשימה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!selectedTask) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const cleanedTask = cleanTaskForFirebase({
        ...selectedTask,
        ...taskData
      });
      validateTask(cleanedTask);

      await firebaseService.updateTask(cleanedTask);
      
      if (cleanedTask.reminderDate) {
        const notificationService = NotificationService.getInstance();
        await notificationService.scheduleTaskReminder(cleanedTask);
      }

      setSelectedTask(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Update task error:', error);
      setError(error instanceof Error ? error.message : 'אירעה שגיאה בעדכון המשימה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) return;
    
    try {
      setIsLoading(true);
      const notificationService = NotificationService.getInstance();
      await notificationService.cancelTaskReminder(id);
      await firebaseService.deleteTask(id);
      setError(null);
    } catch (error) {
      console.error('Delete task error:', error);
      setError('אירעה שגיאה במחיקת המשימה');
    } finally {
      setIsLoading(false);
    }
  };

  // Backup & Restore Functions
  const handleBackup = async () => {
    try {
      const dataStr = JSON.stringify(tasks);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = `tasks-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Backup error:', error);
      setError('אירעה שגיאה בגיבוי המשימות');
    }
  };

  const handleRestore = () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const content = await file.text();
          const backupData = JSON.parse(content) as Task[];
          
          if (window.confirm('פעולה זו תחליף את כל המשימות הקיימות. האם להמשיך?')) {
            setIsLoading(true);
            await firebaseService.clearAllTasks();
            await Promise.all(backupData.map(task => firebaseService.saveTask(task)));
            setError(null);
          }
        } catch (error) {
          console.error('Restore error:', error);
          setError('אירעה שגיאה בשחזור הגיבוי');
        } finally {
          setIsLoading(false);
        }
      };

      input.click();
    } catch (error) {
      console.error('Restore init error:', error);
      setError('אירעה שגיאה בתהליך השחזור');
    }
  };

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        task.taskName.toLowerCase().includes(searchLower) || 
        task.clientName.toLowerCase().includes(searchLower) ||
        (task.court?.toLowerCase().includes(searchLower)) ||
        (task.judge?.toLowerCase().includes(searchLower))
      );
    })
    .filter(task => activeTab === 'completed' ? task.completed : !task.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-center">מנהל משימות</h1>
      
      {/* Top Bar */}
      <div className="mb-4 flex flex-wrap gap-2 sm:gap-4 items-center">
        <Button
          onClick={() => {
            setSelectedTask(null);
            setFormType('add');
            setIsFormOpen(true);
          }}
          size="icon"
          className="shrink-0"
          title="הוסף משימה"
        >
          <Plus size={20} />
        </Button>

        <div className="flex-1 relative min-w-[200px]">
          <Input
            placeholder="חיפוש משימות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleBackup}
            size="icon"
            variant="outline"
            className="shrink-0"
            title="גיבוי"
          >
            <Save size={20} />
          </Button>
          <Button
            onClick={handleRestore}
            size="icon"
            variant="outline"
            className="shrink-0"
            title="שחזור"
          >
            <RotateCcw size={20} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 gap-2">
        <Button
          variant={activeTab === 'completed' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('completed')}
          className="flex-1"
        >
          משימות שהושלמו
        </Button>
        <Button
          variant={activeTab === 'active' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('active')}
          className="flex-1"
        >
          משימות פעילות
        </Button>

        </div>

      {/* Error Messages */}
      {(error || isError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex justify-between items-center">
            {error || 'אירעה שגיאה. אנא נסה שוב.'}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.reload()}
                className="h-auto p-1"
                title="רענן דף"
              >
                <RefreshCw size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setError(null);
                  setIsError(false);
                }}
                className="h-auto p-1"
              >
                <X size={16} />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Content */}
      <div className="relative min-h-[200px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map(task => (
              <TaskCard 
                key={task.id}
                task={task}
                onToggleComplete={async () => {
                  try {
                    await firebaseService.updateTaskStatus(task.id, !task.completed);
                  } catch (error) {
                    console.error('Toggle status error:', error);
                    setError('אירעה שגיאה בעדכון סטטוס המשימה');
                  }
                }}
                onEdit={() => {
                  setSelectedTask(task);
                  setFormType('edit');
                  setIsFormOpen(true);
                }}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'לא נמצאו משימות התואמות את החיפוש' : 'אין משימות להצגה'}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      {isFormOpen && (
        <TaskFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setSelectedTask(null);
          }}
          onSubmit={async (taskData) => {
            if (selectedTask) {
              await handleUpdateTask(taskData);
            } else {
              await handleAddTask(taskData);
            }
          }}
          initialTask={selectedTask}
        />
      )}
    </div>
  );
};

export default TaskManager;