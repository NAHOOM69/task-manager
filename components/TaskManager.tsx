'use client';

import React, { useState, useEffect } from 'react';
import { firebaseService } from '../lib/firebase';

// פונקציית עזר לבדיקה אם רץ בדפדפן
const isBrowser = () => typeof window !== 'undefined';

// טיפוסי משימה
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

// פונקציית עזר לפורמט תאריכים
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

// פונקציה לבדיקת זמן התרעה
const isTimeToNotify = (targetTime: number): boolean => {
  const now = new Date().getTime();
  const diff = now - targetTime;
  return diff >= 0 && diff <= 120000; // זמן התראה מדויק עד 2 דקות
};

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<NewTask>({
    clientName: '',
    task: '',
    dueDate: '',
    reminderDate: '',
    completed: false,
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // פונקציה לטיפול בעריכת משימה
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      clientName: task.clientName,
      task: task.task,
      dueDate: task.dueDate,
      reminderDate: task.reminderDate || '',
      completed: task.completed,
    });
  };

  // שאר הפונקציות (handleSubmit, handleDeleteTask וכו') יופיעו כאן


  // האזנה לשינויים בנתונים מ-Firebase
  useEffect(() => {
    const unsubscribe = firebaseService.onTasksChange((updatedTasks) => {
      setTasks(updatedTasks);
    });
    return () => unsubscribe();
  }, []);

  // בקשת הרשאות להתראות
  useEffect(() => {
    const setupNotifications = async () => {
      if (isBrowser() && 'Notification' in window) {
        try {
          const permission = await Notification.requestPermission();
          console.log('Notification permission:', permission);
          if (permission !== 'granted') {
            alert('כדי לקבל תזכורות, יש לאשר הרשאות התראות.');
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      }
    };

    setupNotifications();
  }, []);

  // טיפול בהתראות למשימות
  useEffect(() => {
    if (!isBrowser()) return;

    const checkTaskNotifications = async () => {
      const now = new Date().getTime();

      for (const task of tasks) {
        if (task.completed) continue;

        // התרעה עבור תאריך יעד
        if (task.dueDate && !task.notified) {
          const dueTime = new Date(task.dueDate).getTime();
          if (isTimeToNotify(dueTime)) {
            await sendNotification(task, 'הגיע מועד המשימה!');
          }
        }

        // התרעה עבור תאריך תזכורת
        if (task.reminderDate && !task.notified) {
          const reminderTime = new Date(task.reminderDate).getTime();
          if (isTimeToNotify(reminderTime)) {
            await sendNotification(task, 'זמן התזכורת למשימה!');
          }
        }
      }
    };

    // בדיקה כל 30 שניות
    const interval = setInterval(checkTaskNotifications, 30000);

    // בדיקה ראשונית
    checkTaskNotifications();

    return () => clearInterval(interval);
  }, [tasks]);

 // שליחת התראה
const sendNotification = async (task: Task, message: string) => {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(message, {
        body: `משימה: ${task.task}\nלקוח: ${task.clientName}`,
        icon: './public/icons/icon-192x192.png', // הוסף פסיק כאן
        tag: `task-${task.id}`, // מונע התראות כפולות
        requireInteraction: true,
      });
    }
  } catch (error) {
    console.error('Error in sendNotification:', error);
  }
};

        // עדכון סטטוס
        const updatedTask = { ...task, notified: true };
        await firebaseService.saveTask(updatedTask);
        console.log('Task notification status updated.');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // טיפול בהגשת טופס הוספה/עריכה של משימה
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (editingTask) {
        const updatedTask = {
          ...newTask,
          id: editingTask.id,
          notified: editingTask.notified,
        };
        await firebaseService.saveTask(updatedTask);
        alert('המשימה עודכנה בהצלחה!');
      } else {
        const taskWithId = {
          ...newTask,
          id: Date.now(),
          notified: false,
        };
        await firebaseService.saveTask(taskWithId);
        alert('המשימה נוספה בהצלחה!');
      }

      // איפוס שדות הטופס
      setEditingTask(null);
      setNewTask({ clientName: '', task: '', dueDate: '', reminderDate: '', completed: false });
    } catch (error) {
      console.error('שגיאה בשמירת המשימה:', error);
      alert('אירעה שגיאה בשמירת המשימה.');
    }
  };

  // שינוי סטטוס משימה (הושלמה/לא הושלמה)
  const handleTaskCompletion = async (taskId: number) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        const updatedTask = { ...task, completed: !task.completed };
        await firebaseService.saveTask(updatedTask);
      }
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס המשימה:', error);
      alert('אירעה שגיאה בעדכון סטטוס המשימה.');
    }
  };

  // מחיקת משימה
  const handleDeleteTask = async (taskId: number) => {
    const confirmDelete = window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?');
    if (confirmDelete) {
      try {
        await firebaseService.deleteTask(taskId);
      } catch (error) {
        console.error('שגיאה במחיקת המשימה:', error);
        alert('אירעה שגיאה במחיקת המשימה.');
      }
    }
  };

  // סינון וחיפוש משימות
  const filteredAndSearchedTasks = tasks
    .filter((task) => {
      if (filterStatus === 'active') return !task.completed;
      if (filterStatus === 'completed') return task.completed;
      return true;
    })
    .filter((task) => task.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || task.task.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // ממשק המשתמש
  return (
    <div className="container mx-auto p-4 space-y-6" dir="rtl">
      {/* טופס הוספה / עריכה */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">{editingTask ? 'ערוך משימה' : 'הוסף משימה חדשה'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="clientName" className="text-sm text-gray-600 mb-1">שם הלקוח</label>
              <input
                id="clientName"
                type="text"
                value={newTask.clientName}
                onChange={(e) => setNewTask({ ...newTask, clientName: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="taskDescription" className="text-sm text-gray-600 mb-1">תיאור משימה</label>
              <input
                id="taskDescription"
                type="text"
                value={newTask.task}
                onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="dueDate" className="text-sm text-gray-600 mb-1">תאריך יעד</label>
              <input
                id="dueDate"
                type="datetime-local"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="reminderDate" className="text-sm text-gray-600 mb-1">תאריך תזכורת (אופציונלי)</label>
              <input
                id="reminderDate"
                type="datetime-local"
                value={newTask.reminderDate}
                onChange={(e) => setNewTask({ ...newTask, reminderDate: e.target.value })}
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
                  setNewTask({ clientName: '', task: '', dueDate: '', reminderDate: '', completed: false });
                }}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
              >
                בטל עריכה
              </button>
            )}
          </div>
        </form>
      </div>

      {/* חיפוש וסינון משימות */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <label htmlFor="searchInput" className="sr-only">חיפוש משימות</label>
            <input
              id="searchInput"
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
              className={`px-4 py-2 rounded-md ${filterStatus === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              הכל
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-md ${filterStatus === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              פעיל
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-md ${filterStatus === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              הושלם
            </button>
          </div>
        </div>
      </div>

      {/* רשימת משימות */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">רשימת משימות</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="sr-only">סטטוס השלמה</span>
                </th>
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
                  className={` ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} ${task.completed ? 'bg-gray-100' : ''} hover:bg-gray-50 transition-colors`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleTaskCompletion(task.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      aria-label={`סמן משימה ${task.completed ? 'כהושלמה' : 'כלא הושלמה'}`}
                    />
                  </td>
                  <td className="px-6 py-4 font-bold">{task.clientName}</td>
                  <td className="px-6 py-4">{task.task}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(task.dueDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{task.reminderDate ? formatDate(task.reminderDate) : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-blue-600 hover:text-blue-900"
                        aria-label={`ערוך משימה: ${task.task}`}
                      >
                        ערוך
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-900 mr-4"
                        aria-label={`מחק משימה: ${task.task}`}
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