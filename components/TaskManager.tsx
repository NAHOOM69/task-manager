'use client';

import React, { useState, useEffect } from 'react';
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
  Save,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { firebaseService } from '@/lib/firebase';
import { NotificationService } from '@/lib/notifications';
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

// Types
interface Task {
  id: number;
  clientName: string;
  taskName: string;
  dueDate: string;
  reminderDate?: string;
  completed: boolean;
  notified?: boolean;
  courtDate?: string;
  court?: string;
  judge?: string;
  type: 'hearing' | 'regular';
}

type TaskInput = Omit<Task, 'id' | 'completed' | 'notified'>;

// Browser Support Check
const checkBrowserSupport = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    
    if (!window.localStorage) {
      throw new Error('Local storage not supported');
    }
    
    if (!window.indexedDB) {
      throw new Error('IndexedDB not supported');
    }
    
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
    }
    
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
    }

    return true;
  } catch (error) {
    console.error('Browser support check failed:', error);
    return false;
  }
};

// Date Formatting Helper
const formatDateForDevice = (dateString: string): string => {
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
};

const formatDateTimeForDevice = (dateString: string): string => {
  try {
    const date = new Date(dateString.replace(/-/g, '/'));
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return format(date, 'dd/MM/yyyy HH:mm', { locale: he });
  } catch (error) {
    console.error('Date/time formatting error:', error);
    return dateString;
  }
};

// Main Component
const TaskManager = () => {
  // State declarations
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState<'add' | 'edit'>('add');
  const [isError, setIsError] = useState<boolean>(false);

  // Initialize NotificationService
  useEffect(() => {
    const initApp = async () => {
      try {
        const notificationService = NotificationService.getInstance();
        await notificationService.init();
        await notificationService.requestPermission();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };
    void initApp();
  }, []);

  // Error handling
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        await firebaseService.testConnection();
        cleanup = firebaseService.onTasksChange(
          (updatedTasks: Task[]) => {
            setTasks(updatedTasks.filter(task => task !== null));
            setIsLoading(false);
          },
          (error: Error) => {
            console.error('Firebase error:', error);
            setError('אירעה שגיאה בטעינת המשימות. אנא נסה שוב מאוחר יותר.');
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error('Connection error:', error);
        setError('אין חיבור לשרת. אנא בדוק את החיבור לאינטרנט.');
        setIsLoading(false);
      }
    };
  
    void initializeApp();
  
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  // Browser support check
  useEffect(() => {
    if (!checkBrowserSupport()) {
      setError('הדפדפן שלך אינו תומך בכל התכונות הנדרשות. אנא נסה דפדפן אחר.');
    }
  }, []);

  // Check reminders
  useEffect(() => {
    const notificationService = NotificationService.getInstance();
    
    const checkReminders = async () => {
      const now = new Date();
      for (const task of tasks) {
        try {
          if (
            task.reminderDate && 
            !task.notified && 
            !task.completed &&
            new Date(task.reminderDate) <= now
          ) {
            await notificationService.sendImmediateNotification(task);
            await firebaseService.updateTask({
              ...task,
              notified: true
            });
          }
        } catch (error) {
          console.error('Error checking reminder for task:', task.id, error);
        }
      }
    };

    const interval = setInterval(() => void checkReminders(), 60000);
    void checkReminders();
    return () => clearInterval(interval);
  }, [tasks]);

  // Task Management Functions
  const handleAddTask = async (taskData: TaskInput) => {
    if (!taskData.clientName?.trim() || !taskData.taskName?.trim() || !taskData.dueDate) {
      setError('יש למלא את כל שדות החובה');
      return;
    }

    try {
      setIsLoading(true);
      const task: Task = {
        ...taskData,
        id: Date.now(),
        completed: false,
        notified: false,
        type: taskData.courtDate ? 'hearing' : 'regular'
      };

      await firebaseService.saveTask(task);
      if (taskData.reminderDate) {
        const notificationService = NotificationService.getInstance();
        await notificationService.scheduleTaskReminder(task);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Add task error:', error);
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
        type: taskData.courtDate ? 'hearing' : 'regular'
      };

      if (taskData.reminderDate) {
        const notificationService = NotificationService.getInstance();
        await notificationService.scheduleTaskReminder(updatedTask);
      }

      await firebaseService.updateTask(updatedTask);
      setSelectedTask(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Update task error:', error);
      setError('אירעה שגיאה בעדכון המשימה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) return;
    
    try {
      const notificationService = NotificationService.getInstance();
      await notificationService.cancelTaskReminder(id);
      
      setIsLoading(true);
      await firebaseService.deleteTask(id);
    } catch (error) {
      console.error('Delete task error:', error);
      setError('אירעה שגיאה במחיקת המשימה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      setIsLoading(true);
      const newStatus = !task.completed;
      await firebaseService.updateTaskStatus(id, newStatus);
    } catch (error) {
      console.error('Toggle complete error:', error);
      setError(`אירעה שגיאה ב${task.completed ? 'ביטול' : 'סימון'} המשימה כהושלמה. אנא נסה שוב.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = () => {
    try {
      const dataStr = JSON.stringify(tasks);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', `tasks-backup-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Backup error:', error);
      setError('אירעה שגיאה בגיבוי המשימות. אנא נסה שוב.');
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
          }
        } catch (error) {
          console.error('Restore error:', error);
          setError('אירעה שגיאה בשחזור הגיבוי. אנא ודא שהקובץ תקין.');
        } finally {
          setIsLoading(false);
        }
      };

      input.click();
    } catch (error) {
      console.error('Restore init error:', error);
      setError('אירעה שגיאה בתהליך השחזור. אנא נסה שוב.');
    }
  };

  // FormDialog Component
  const FormDialog = ({
    task,
    isOpen,
    onClose,
    onSubmit
  }: {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (taskData: TaskInput) => Promise<void>;
  }) => {
    const [formData, setFormData] = useState<TaskInput>({
      clientName: task?.clientName || '',
      taskName: task?.taskName || '',
      dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
      reminderDate: task?.reminderDate || '',
      type: task?.type || 'regular',
      court: task?.court || '',
      judge: task?.judge || '',
      courtDate: task?.courtDate || ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      if (task) {
        setFormData({
          clientName: task.clientName,
          taskName: task.taskName,
          dueDate: task.dueDate.split('T')[0],
          reminderDate: task.reminderDate || '',
          type: task.type,
          court: task.court || '',
          judge: task.judge || '',
          courtDate: task.courtDate || ''
        });
      }
    }, [task]);

    // ... (rest of FormDialog implementation remains the same)
  };

  // TaskCard Component
  const TaskCard = ({ task }: { task: Task }) => {
    const isOverdue = !task.completed && new Date(task.dueDate) < new Date();

    // ... (rest of TaskCard implementation remains the same)
  };

  // Filter and sort tasks
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

  // Main render
  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4" dir="rtl">
      {/* ... (rest of the render implementation remains the same) ... */}
    </div>
  );
};

export default TaskManager;