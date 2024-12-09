'use client';

import React, { useState, useEffect } from 'react';

import BackupRestoreButtons from '@/components/BackupRestoreButtons';

import TaskFormDialog from './TaskFormDialog';

import { Task, TaskType, TaskInput } from '@/types/Task';
import { Case } from '@/types/Case';

import { Upload } from 'lucide-react';


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
  FolderOpen,
  Copy,
  CalendarCheck,
  Gavel,
  Hash,
  FileText
} from 'lucide-react';


import { FirebaseService } from '@/lib/firebase';
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
 // const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState<'add' | 'edit'>('add');

  useEffect(() => {
    console.log('Setting up tasks listener');
    setIsLoading(true);
  
    try {
      const unsubscribe = FirebaseService.onTasksChange((updatedTasks: Record<string, Task>) => {
        console.log('Received tasks from Firebase:', updatedTasks);
        
        if (!updatedTasks) {
          console.log('No tasks received');
          setTasks([]);
          setIsLoading(false);
          return;
        }
  
        // המרה בסיסית של הנתונים למערך
        const tasksArray = Object.values(updatedTasks);
        console.log('Converted to array:', tasksArray);
        
        setTasks(tasksArray);
        setIsLoading(false);
      });
  
      return () => {
        console.log('Cleaning up tasks listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error in tasks setup:', error);
      setError('אירעה שגיאה בטעינת המשימות');
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
      const taskToSave = {
        ...taskData,
        completed: false,
        notified: false
      };

      await FirebaseService.saveTask(taskToSave);
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
      const updatedTask: Partial<Task> = {
  clientName: taskData.clientName,
  taskName: taskData.taskName,
  dueDate: taskData.dueDate,
  reminderDate: taskData.reminderDate,
  type: taskData.type,
  court: taskData.court,
  judge: taskData.judge,
  courtDate: taskData.courtDate
};
  
      // יש לוודא שמועברים שני פרמטרים: מזהה המשימה והמידע המעודכן
      await FirebaseService.updateTask(String(selectedTask.id), updatedTask);

  
      setSelectedTask(null);
      setIsFormOpen(false);
    } catch (error) {
      setError('אירעה שגיאה בעדכון המשימה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) return;
    
    try {
      setIsLoading(true);
      await FirebaseService.deleteTask(id);
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
      
      // עדכון ב-Firebase
      await FirebaseService.updateTaskStatus(id, newStatus);
      
      // עדכון מקומי של המשימות
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === id ? { ...t, completed: newStatus } : t
        )
      );

    } catch (error) {
      setError(`אירעה שגיאה ב${task.completed ? "ביטול" : "סימון"} המשימה כהושלמה`);
      console.error('Toggle complete error:', error);
    } finally {
      setIsLoading(false);
    }
};


  const handleImportLegacy = async () => {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const text = await file.text();
          const tasks = JSON.parse(text);
          await FirebaseService.importLegacyData(tasks);
          alert('הנתונים יובאו בהצלחה');
        }
      };
      fileInput.click();
    } catch (error) {
      console.error('Import failed:', error);
      alert('שגיאה בייבוא הנתונים');
    }
  };
  
  


  const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    const relatedCase = task.caseId ? cases.find(c => c.id === task.caseId) : null;
  
    // פונקציה לחישוב ימים שנותרו
    const getDaysLeft = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'היום';
      if (diffDays === 1) return 'מחר';
      if (diffDays < 0) return `באיחור של ${Math.abs(diffDays)} ימים`;
      return `בעוד ${diffDays} ימים`;
    };
  
    // פונקציית השכפול
    const handleDuplicate = async () => {
      try {
        const duplicatedTask = {
          clientName: task.clientName || '',
          taskName: task.taskName || '',
          dueDate: task.dueDate || new Date().toISOString(),
          type: task.type,
          ...(task.reminderDate && { reminderDate: task.reminderDate }),
          ...(task.court && { court: task.court }),
          ...(task.judge && { judge: task.judge }),
          ...(task.courtDate && { courtDate: task.courtDate }),
          ...(task.caseId && { caseId: task.caseId }),
          ...(task.caseNumber && { caseNumber: task.caseNumber }),
          ...(task.legalNumber && { legalNumber: task.legalNumber })
        } as TaskInput;
    
        await FirebaseService.saveTask(duplicatedTask);
      } catch (error) {
        setError('אירעה שגיאה בשכפול המשימה');
      }
    };
  
    // פונקציה להחזרת הצבע המתאים למשימה
    const getTaskStyle = () => {
      const taskNameLower = task.taskName.toLowerCase();
      if (taskNameLower.includes('דיון הוכחות')) {
        return 'border-2 border-blue-500';
      } else if (taskNameLower.includes('דיון')) {
        return 'border-2 border-sky-400';
      } else if (taskNameLower.includes('תצהיר')) {
        return 'border-2 border-orange-300 bg-orange-50';
      }
      return '';
    };
  
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow ${getTaskStyle()}`}>
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
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar width={16} height={16} />
                <span>{new Date(task.dueDate).toLocaleDateString('he-IL')}</span>
              </div>
              <div className={`flex items-center gap-1 ${
                task.completed ? 'text-green-500' :
                getDaysLeft().includes('באיחור') ? 'text-red-500' :
                getDaysLeft() === 'היום' ? 'text-orange-500' :
                getDaysLeft() === 'מחר' ? 'text-yellow-500' :
                'text-blue-500'
              } font-medium`}>
                {getDaysLeft()}
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

            {/* תוספת פרטי דיון משפטי */}
            {(task.court || task.judge || task.courtDate || task.legalNumber || task.caseNumber) && (
              <div className="mt-2 p-3 bg-sky-50 rounded-md">
                <div className="text-sm space-y-1">
                  {task.court && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-600" />
                      <span>בית משפט: {task.court}</span>
                    </div>
                  )}
                  {task.legalNumber && (
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-sky-600" />
                      <span>מספר ליגל: {task.legalNumber}</span>
                    </div>
                  )}
                  {task.caseNumber && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-600" />
                      <span>מספר תיק: {task.caseNumber}</span>
                    </div>
                  )}
                  {task.judge && (
                    <div className="flex items-center gap-2">
                      <Gavel className="w-4 h-4 text-sky-600" />
                      <span>שופט: {task.judge}</span>
                    </div>
                  )}
                  {task.courtDate && (
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-sky-600" />
                      <span>מועד דיון: {new Date(task.courtDate).toLocaleDateString('he-IL', {
                        hour: 'numeric',
                        minute: 'numeric'
                      })}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
  
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
                    <Building2 width={16} height={16} className="text-blue-500" />
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
              onClick={handleDuplicate}
              title="שכפל משימה"
            >
              <Copy width={20} height={20} className="text-gray-400 hover:text-blue-500" />
            </Button>
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
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const filteredTasks = React.useMemo(() => {
    console.log('Starting task filtering and sorting');
  
    // בדיקה שיש לנו מערך משימות תקין
    if (!Array.isArray(tasks)) {
      console.log('Tasks is not an array');
      return [];
    }
  
    // יצירת עותק של המערך
    return tasks
      .filter(task => {
        if (!task) return false;
  
        // סינון לפי חיפוש
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const clientNameMatch = (task.clientName || '').toLowerCase().includes(searchLower);
          const taskNameMatch = (task.taskName || '').toLowerCase().includes(searchLower);
          
          if (!clientNameMatch && !taskNameMatch) {
            return false;
          }
        }
  
        // סינון לפי סטטוס השלמה
        return activeTab === 'completed' ? Boolean(task.completed) : !Boolean(task.completed);
      })
      .sort((a, b) => {
        if (!a?.dueDate || !b?.dueDate) return 0;
        
        try {
          const dateA = new Date(a.dueDate).getTime();
          const dateB = new Date(b.dueDate).getTime();
          
          if (isNaN(dateA) || isNaN(dateB)) return 0;
          return dateA - dateB;
        } catch {
          return 0;
        }
      });
  }, [tasks, searchQuery, activeTab]);

   
    return (
      <div className="max-w-4xl mx-auto p-4" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">מנהל משימות</h1>
          <div className="flex gap-2">
            <BackupRestoreButtons />
            <Button 
              variant="outline"
              onClick={handleImportLegacy}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              ייבוא נתונים ישנים
            </Button>
          </div>
        </div>
    
        <div className="mb-4 flex gap-4 items-center">
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
      </div>
    );
    }
export default TaskManager;