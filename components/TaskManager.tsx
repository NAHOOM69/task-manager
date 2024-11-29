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
    // בדיקת תמיכה בדפדפן
    if (typeof window === 'undefined') return false;
    
    // בדיקת localStorage
    if (!window.localStorage) {
      throw new Error('Local storage not supported');
    }
    
    // בדיקת IndexedDB
    if (!window.indexedDB) {
      throw new Error('IndexedDB not supported');
    }
    
    // בדיקת Service Worker
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
    }
    
    // בדיקת Notifications
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
    // תיקון פורמט התאריך עבור מובייל
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
  const [isError, setIsError] = useState<boolean>(false);

  // Error handling
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        await firebaseService.testConnection();
        cleanup = firebaseService.onTasksChange(
          (updatedTasks: Task[]) => {
            setTasks(updatedTasks.filter(task => task !== null)); // מסנן ערכים null
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
  
    initializeApp();
  
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

  // Firebase connection and data subscription
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        await firebaseService.testConnection();
        unsubscribe = firebaseService.onTasksChange(
          (updatedTasks: Task[]) => {
            setTasks(updatedTasks);
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
  
    initializeApp();
  
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Notifications and Reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        try {
          if (
            task.reminderDate && 
            !task.notified && 
            !task.completed &&
            new Date(task.reminderDate) <= now
          ) {
            if (Notification.permission !== 'granted') {
              Notification.requestPermission();
            }

            if (Notification.permission === 'granted') {
              new Notification('תזכורת למשימה', {
                body: `${task.clientName}: ${task.taskName}`,
                icon: '/favicon.ico',
                tag: `task-${task.id}`,
                renotify: true
              });

              firebaseService.updateTask({
                ...task,
                notified: true
              }).catch(error => {
                console.error('Failed to update notification status:', error);
              });
            }
          }
        } catch (error) {
          console.error('Error checking reminder for task:', task.id, error);
        }
      });
    };

    const interval = setInterval(checkReminders, 60000);
    checkReminders();
    return () => clearInterval(interval);
  }, [tasks]);

  // Task Management Functions
  const handleAddTask = async (taskData: TaskInput) => {
    if (!taskData.clientName?.trim() || !taskData.taskName?.trim() || !taskData.dueDate) {
      setError('יש למלא את כל השדות החובה');
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
  const FormDialog: React.FC<{
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (taskData: TaskInput) => Promise<void>;
  }> = ({ task, isOpen, onClose, onSubmit }) => {
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
      // Reset form data when task changes
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

    const validateForm = () => {
      const newErrors: Record<string, string> = {};
      if (!formData.clientName?.trim()) newErrors.clientName = 'שם לקוח הוא שדה חובה';
      if (!formData.taskName?.trim()) newErrors.taskName = 'שם משימה הוא שדה חובה';
      if (!formData.dueDate) newErrors.dueDate = 'תאריך יעד הוא שדה חובה';
      
      if (formData.type === 'hearing') {
        if (!formData.court?.trim()) newErrors.court = 'בית משפט הוא שדה חובה עבור דיון';
        if (!formData.courtDate) newErrors.courtDate = 'תאריך דיון הוא שדה חובה';
      }

      // Validate dates
      try {
        if (formData.dueDate) {
          const dueDate = new Date(formData.dueDate);
          if (isNaN(dueDate.getTime())) {
            newErrors.dueDate = 'תאריך לא תקין';
          }
        }
        if (formData.reminderDate) {
          const reminderDate = new Date(formData.reminderDate);
          if (isNaN(reminderDate.getTime())) {
            newErrors.reminderDate = 'תאריך תזכורת לא תקין';
          }
        }
        if (formData.courtDate) {
          const courtDate = new Date(formData.courtDate);
          if (isNaN(courtDate.getTime())) {
            newErrors.courtDate = 'תאריך דיון לא תקין';
          }
        }
      } catch (error) {
        console.error('Date validation error:', error);
        newErrors.dateValidation = 'אירעה שגיאה באימות התאריכים';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      setIsSubmitting(true);
      try {
        await onSubmit(formData);
        onClose();
      } catch (error) {
        console.error('Form submission error:', error);
        setErrors(prev => ({
          ...prev,
          submit: 'אירעה שגיאה בשמירת המשימה. אנא נסה שוב.'
        }));
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="mx-auto max-w-md w-full" dir="rtl">
          <DialogHeader>
            <DialogTitle>{task ? 'עריכת משימה' : 'משימה חדשה'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <fieldset>
                <Label>סוג משימה</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      value="regular"
                      checked={formData.type === 'regular'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'regular' | 'hearing' }))}
                      className="w-4 h-4"
                    />
                    <span>משימה רגילה</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      value="hearing"
                      checked={formData.type === 'hearing'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'regular' | 'hearing' }))}
                      className="w-4 h-4"
                    />
                    <span>דיון משפטי</span>
                  </label>
                </div>
              </fieldset>

              <div>
                <Label htmlFor="clientName">שם לקוח</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className={errors.clientName ? "border-red-500" : ""}
                />
                {errors.clientName && (
                  <p className="text-sm text-red-500 mt-1">{errors.clientName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="taskName">שם משימה</Label>
                <Input
                  id="taskName"
                  value={formData.taskName}
                  onChange={(e) => setFormData(prev => ({ ...prev, taskName: e.target.value }))}
                  className={errors.taskName ? "border-red-500" : ""}
                />
                {errors.taskName && (
                  <p className="text-sm text-red-500 mt-1">{errors.taskName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="dueDate">תאריך יעד</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className={errors.dueDate ? "border-red-500" : ""}
                />
                {errors.dueDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.dueDate}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reminderDate">תזכורת</Label>
                <Input
                  id="reminderDate"
                  type="datetime-local"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminderDate: e.target.value }))}
                  className={errors.reminderDate ? "border-red-500" : ""}
                />
                {errors.reminderDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.reminderDate}</p>
                )}
              </div>

              {formData.type === 'hearing' && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium">פרטי דיון</h3>
                  
                  <div>
                    <Label htmlFor="court">בית משפט</Label>
                    <Input
                      id="court"
                      value={formData.court}
                      onChange={(e) => setFormData(prev => ({ ...prev, court: e.target.value }))}
                      className={errors.court ? "border-red-500" : ""}
                    />
                    {errors.court && (
                      <p className="text-sm text-red-500 mt-1">{errors.court}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="judge">שופט</Label>
                    <Input
                      id="judge"
                      value={formData.judge}
                      onChange={(e) => setFormData(prev => ({ ...prev, judge: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="courtDate">תאריך ושעת דיון</Label>
                    <Input
                      id="courtDate"
                      type="datetime-local"
                      value={formData.courtDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, courtDate: e.target.value }))}
                      className={errors.courtDate ? "border-red-500" : ""}
                    />
                    {errors.courtDate && (
                      <p className="text-sm text-red-500 mt-1">{errors.courtDate}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {errors.submit && (
              <Alert variant="destructive">
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                ביטול
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'שומר...' : task ? 'עדכן משימה' : 'צור משימה'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // TaskCard Component
  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const isOverdue = !task.completed && new Date(task.dueDate) < new Date();

    return (
      <div 
        className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow
          ${task.type === 'hearing' ? 'border-r-4 border-blue-500' : ''}
          ${isOverdue ? 'border border-red-500' : ''}`}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1 truncate">{task.clientName}</h3>
            <p className="text-gray-600 mb-2">{task.taskName}</p>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{formatDateForDevice(task.dueDate)}</span>
              </div>
              {task.reminderDate && (
                <div className="flex items-center gap-1">
                  <Bell size={16} />
                  <span>{formatDateTimeForDevice(task.reminderDate)}</span>
                </div>
              )}
            </div>

            {task.type === 'hearing' && (
              <div className="mt-3 p-2 bg-gray-50 rounded-lg text-sm space-y-2">
                {task.courtDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    <span>דיון: {formatDateTimeForDevice(task.courtDate)}</span>
                  </div>
                )}
                {task.court && (
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-blue-500" />
                    <span>בימש: {task.court}</span>
                  </div>
                )}
                {task.judge && (
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-blue-500" />
                    <span>שופט: {task.judge}</span>
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
                <RotateCcw size={20} className="text-blue-500" />
              ) : (
                <CheckCircle size={20} className="text-gray-400 hover:text-green-500" />
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
              <Edit2 size={20} className="text-gray-400 hover:text-blue-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteTask(task.id)}
              title="מחק משימה"
            >
              <Trash2 size={20} className="text-gray-400 hover:text-red-500" />
            </Button>
          </div>
        </div>
      </div>
    );
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
      <h1 className="text-2xl font-bold mb-6 text-center">מנהל משימות</h1>
      
      {/* Top Bar with Search and Actions */}
      <div className="mb-4 flex flex-wrap gap-2 sm:gap-4 items-center">
        {/* Right - Add Task */}
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

        {/* Center - Search */}
        <div className="flex-1 relative min-w-[200px]">
          <Input
            placeholder="חיפוש משימות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>

        {/* Left - Backup/Restore */}
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
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'לא נמצאו משימות התואמות את החיפוש' : 'אין משימות להצגה'}
          </div>
        )}
      </div>

      {/* Task Form Dialog */}
      {isFormOpen && (
        <FormDialog
          task={selectedTask}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedTask(null);
          }}
          onSubmit={selectedTask ? handleUpdateTask : handleAddTask}
        />
      )}
    </div>
  );
};

export default TaskManager;