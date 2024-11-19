'use client';
import React, { useState, useEffect } from 'react';
import { firebaseService } from '../lib/firebase';

// פונקציית עזר לבדיקה האם אנחנו בדפדפן
const isBrowser = () => typeof window !== 'undefined';

interface Task {
  id: number;
  clientName: string;
  task: string;
  dueDate: string;
  reminderDate?: string;
  completed: boolean;
  notified?: boolean;
}

type NewTask = Omit<Task, 'id' | 'notified'>;
type FilterStatus = 'all' | 'active' | 'completed';

// פונקציית עזר לפורמט התאריך
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const TaskManager: React.FC = () => {
  // הגדרת state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<NewTask>({
    clientName: '',
    task: '',
    dueDate: '',
    reminderDate: '',
    completed: false
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

 // האזנה לשינויים בנתונים מ-Firebase
 useEffect(() => {
  const unsubscribe = firebaseService.onTasksChange((updatedTasks) => {
    setTasks(updatedTasks);
  });
  return () => unsubscribe();
}, []);

// הגדרת הרשאות התראות בטעינה
useEffect(() => {
  if (isBrowser()) {
    requestNotificationPermission();
  }
}, []);

// מערכת התראות
useEffect(() => {
  if (!isBrowser()) return;

  const checkReminders = async () => {
    const now = new Date().getTime();
    tasks.forEach(async (task) => {
      if (!task.completed) {
        const dueTime = new Date(task.dueDate).getTime();
        
        // בדיקת זמן יעד
        if (Math.abs(now - dueTime) < 30000 && !task.notified) { // 30 שניות
          console.log('Sending due date notification for task:', task.task);
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('הגיע מועד המשימה!', {
              body: `משימה: ${task.task}\nלקוח: ${task.clientName}`,
              icon: '/icons/icon-192x192.png'
            });

            const updatedTask = { ...task, notified: true };
            await firebaseService.saveTask(updatedTask);
          }
        }

        // בדיקת זמן תזכורת
        if (task.reminderDate) {
          const reminderTime = new Date(task.reminderDate).getTime();
          if (Math.abs(now - reminderTime) < 30000 && !task.notified) {
            console.log('Sending reminder notification for task:', task.task);
            
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('תזכורת למשימה', {
                body: `משימה: ${task.task}\nלקוח: ${task.clientName}`,
                icon: '/icons/icon-192x192.png'
              });

              const updatedTask = { ...task, notified: true };
              await firebaseService.saveTask(updatedTask);
            }
          }
        }
      }
    });
  };

  const interval = setInterval(checkReminders, 10000); // בדיקה כל 10 שניות
  return () => clearInterval(interval);
}, [tasks]);

// פונקציה לבקשת הרשאות התראות
const requestNotificationPermission = async () => {
  if (!isBrowser()) return false;
  
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// טיפול בהגשת הטופס
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  try {
    if (editingTask) {
      // עדכון משימה קיימת
      const updatedTask = {
        ...newTask,
        id: editingTask.id,
        notified: editingTask.notified
      };
      await firebaseService.saveTask(updatedTask);
      alert('המשימה עודכנה בהצלחה!');
    } else {
      // הוספת משימה חדשה
      const taskWithId = {
        ...newTask,
        id: Date.now(),
        notified: false
      };
      await firebaseService.saveTask(taskWithId);

      // שליחת התראה על משימה חדשה
      if (isBrowser() && 'Notification' in window && 
          Notification.permission === 'granted') {
        new Notification('משימה חדשה נוספה', {
          body: `משימה: ${taskWithId.task}\nלקוח: ${taskWithId.clientName}`,
          icon: '/icons/icon-192x192.png'
        });
      }
      alert('המשימה נוספה בהצלחה!');
    }

    // איפוס הטופס
    setEditingTask(null);
    setNewTask({
      clientName: '',
      task: '',
      dueDate: '',
      reminderDate: '',
      completed: false
    });

    // איפוס שדות הטופס
    const form = e.target as HTMLFormElement;
    form.reset();
    const dateInputs = form.querySelectorAll('input[type="datetime-local"]');
dateInputs.forEach((input) => {
  if (input instanceof HTMLInputElement) {
    input.value = '';
  }
});

  } catch (error) {
    console.error('שגיאה בשמירת המשימה:', error);
    alert('אירעה שגיאה בשמירת המשימה');
  }
};

// טיפול בעריכת משימה
const handleEditTask = (task: Task) => {
  setEditingTask(task);
  setNewTask({
    clientName: task.clientName,
    task: task.task,
    dueDate: task.dueDate,
    reminderDate: task.reminderDate || '',
    completed: task.completed
  });
};

// טיפול בשינוי סטטוס משימה
const handleTaskCompletion = async (taskId: number) => {
  try {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = {
        ...task,
        completed: !task.completed
      };
      await firebaseService.saveTask(updatedTask);
    }
  } catch (error) {
    console.error('שגיאה בעדכון סטטוס המשימה:', error);
    alert('אירעה שגיאה בעדכון סטטוס המשימה');
  }
};

// טיפול במחיקת משימה
const handleDeleteTask = async (taskId: number) => {
  const confirmDelete = window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?');
  if (confirmDelete) {
    try {
      await firebaseService.deleteTask(taskId);
    } catch (error) {
      console.error('שגיאה במחיקת המשימה:', error);
      alert('אירעה שגיאה במחיקת המשימה');
    }
  }
};

// פונקציות גיבוי ושחזור
const handleBackup = () => {
  if (!isBrowser()) return;
  const data = JSON.stringify(tasks);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `task-manager-backup-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!isBrowser()) return;
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const restoredTasks = JSON.parse(event.target?.result as string);
        await firebaseService.saveAllTasks(restoredTasks);
        alert('הנתונים שוחזרו בהצלחה!');
      } catch (error) {
        console.error('שגיאה בשחזור הנתונים:', error);
        alert('שגיאה בשחזור הנתונים. אנא וודא שהקובץ תקין.');
      }
    };
    reader.readAsText(file);
  }
};

// סינון וחיפוש משימות
const filteredAndSearchedTasks = tasks
.filter(task => {
  if (filterStatus === 'active') return !task.completed;
  if (filterStatus === 'completed') return task.completed;
  return true;
})
.filter(task =>
  task.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  task.task.toLowerCase().includes(searchTerm.toLowerCase())
)
.sort((a, b) => {
  if (a.completed === b.completed) {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  }
  return a.completed ? 1 : -1;
});

return (
<div className="container mx-auto p-4 space-y-6" dir="rtl">
  {/* כפתורי גיבוי ושחזור */}
  <div className="bg-white rounded-lg shadow-md p-4">
    <div className="flex justify-end gap-2">
      <button
        onClick={handleBackup}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        גיבוי נתונים
      </button>
      <input
        type="file"
        id="restoreFile"
        className="hidden"
        accept=".json"
        onChange={handleRestore}
      />
      <button
        onClick={() => isBrowser() && document.getElementById('restoreFile')?.click()}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        שחזור מגיבוי
      </button>
    </div>
  </div>

  {/* טופס הוספת/עריכת משימה */}
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-bold mb-4">
      {editingTask ? 'ערוך משימה' : 'הוסף משימה חדשה'}
    </h2>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="שם הלקוח"
          value={newTask.clientName}
          onChange={(e) => setNewTask({...newTask, clientName: e.target.value})}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="text"
          placeholder="משימה"
          value={newTask.task}
          onChange={(e) => setNewTask({...newTask, task: e.target.value})}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">תאריך יעד</label>
          <input
            type="datetime-local"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">תאריך תזכורת (אופציונלי)</label>
          <input
            type="datetime-local"
            value={newTask.reminderDate}
            onChange={(e) => setNewTask({...newTask, reminderDate: e.target.value})}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          {editingTask ? 'עדכן משימה' : 'הוסף משימה'}
        </button>
        {editingTask && (
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setNewTask({
                clientName: '',
                task: '',
                dueDate: '',
                reminderDate: '',
                completed: false
              });
            }}
            className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
          >
            בטל עריכה
          </button>
        )}
      </div>
    </form>
  </div>

{/* חיפוש וסינון */}
<div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="חיפוש לפי לקוח או משימה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-md ${
                filterStatus === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              הכל
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-md ${
                filterStatus === 'active'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              פעילות
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-md ${
                filterStatus === 'completed'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              הושלמו
            </button>
          </div>
        </div>
      </div>

      {/* טבלת משימות */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">רשימת משימות</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">לקוח</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">משימה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך יעד</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תזכורת</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSearchedTasks.map((task, index) => (
                <tr
                  key={task.id}
                  className={`
                    ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}
                    ${task.completed ? 'bg-gray-100' : ''}
                    hover:bg-gray-50 transition-colors
                  `}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleTaskCompletion(task.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 font-bold">{task.clientName}</td>
                  <td className="px-6 py-4">{task.task}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(task.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.reminderDate ? formatDate(task.reminderDate) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ערוך
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-900 mr-4"
                      >
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;  