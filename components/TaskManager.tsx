'use client';

import React, { useState, useEffect } from 'react';

interface Task {
  id: number;
  clientName: string;
  task: string;
  dueDate: string;
  reminderDate?: string;  // שינוי לאופציונלי
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

const StorageManager = {
  saveTasks: (tasks: Task[]): boolean => {
    try {
      localStorage.setItem('taskManagerTasks', JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('Error saving tasks:', error);
      return false;
    }
  },

  loadTasks: (): Task[] => {
    try {
      const savedTasks = localStorage.getItem('taskManagerTasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks) as Task[];
        return parsedTasks;
      }
      return [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }
};

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => StorageManager.loadTasks());
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
  // בדיקת זמינות localStorage
  useEffect(() => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (error) {
      alert('לא ניתן לשמור נתונים במכשיר זה. ייתכן שהדפדפן חוסם גישה ל-localStorage.');
    }
  }, []);

  // שמירת המשימות ב-localStorage בכל שינוי
  useEffect(() => {
    StorageManager.saveTasks(tasks);
  }, [tasks]);

  // הגדרת התראות מתוזמנות
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (!task.completed) {
          // בדיקת תאריך יעד
          const dueTime = new Date(task.dueDate);
          if (Math.abs(now.getTime() - dueTime.getTime()) < 60000 && !task.notified) {
            if (Notification.permission === 'granted') {
              new Notification('הגיע מועד המשימה!', {
                body: `משימה: ${task.task}\nלקוח: ${task.clientName}`,
                icon: '/icons/icon-192x192.png'
              });
              setTasks(prev => prev.map(t => 
                t.id === task.id ? { ...t, notified: true } : t
              ));
            }
          }

          // בדיקת תזכורת (אם קיימת)
          if (task.reminderDate) {
            const reminderTime = new Date(task.reminderDate);
            if (Math.abs(now.getTime() - reminderTime.getTime()) < 60000 && !task.notified) {
              if (Notification.permission === 'granted') {
                new Notification('תזכורת למשימה', {
                  body: `משימה: ${task.task}\nלקוח: ${task.clientName}`,
                  icon: '/icons/icon-192x192.png'
                });
                setTasks(prev => prev.map(t => 
                  t.id === task.id ? { ...t, notified: true } : t
                ));
              }
            }
          }
        }
      });
    };

    // בדיקה כל 30 שניות במקום כל דקה
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingTask) {
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? { ...newTask, id: task.id, notified: task.notified } : task
      ));
      setEditingTask(null);
    } else {
      const taskWithId = { 
        ...newTask, 
        id: Date.now(), 
        notified: false 
      };
      setTasks([...tasks, taskWithId]);

      if (Notification.permission === 'granted') {
        new Notification('משימה חדשה נוספה', {
          body: `משימה: ${taskWithId.task}\nלקוח: ${taskWithId.clientName}`,
          icon: '/icons/icon-192x192.png'
        });
      }
    }

    // איפוס הטופס
    setNewTask({
      clientName: '',
      task: '',
      dueDate: '',
      reminderDate: '',
      completed: false
    });

    // איפוס הערכים בשדות הטופס
    const form = e.target as HTMLFormElement;
    form.reset();
  };

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

  const handleTaskCompletion = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (taskId: number) => {
    const confirmDelete = window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?');
    if (confirmDelete) {
      setTasks(tasks.filter(task => task.id !== taskId));
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
              onClick={() => {
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
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              גיבוי נתונים
            </button>
            <input
              type="file"
              id="restoreFile"
              className="hidden"
              accept=".json"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const restoredTasks = JSON.parse(event.target?.result as string);
                      setTasks(restoredTasks);
                      alert('הנתונים שוחזרו בהצלחה!');
                    } catch (error) {
                      alert('שגיאה בשחזור הנתונים. אנא וודא שהקובץ תקין.');
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
            <button
              onClick={() => document.getElementById('restoreFile')?.click()}
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
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">לקוח</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">משימה</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך יעד</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תזכורת</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSearchedTasks.map((task) => (
                  <tr key={task.id} className={task.completed ? "bg-gray-50" : "bg-white"}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleTaskCompletion(task.id)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">{task.clientName}</td>
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