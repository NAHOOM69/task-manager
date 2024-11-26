'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { firebaseService } from '../lib/firebase';

interface Task {
  id: number;
  clientName: string;
  taskName: string;
  dueDate: string;
  reminderDate?: string;
  completed: boolean;
}

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all');
  const [newTask, setNewTask] = useState<Partial<Task>>({
    clientName: '',
    taskName: '',
    dueDate: '',
    reminderDate: '',
    completed: false,
  });

  const checkForDueTasksAndReminders = useCallback((taskList: Task[]) => {
    const now = new Date();
    taskList.forEach(task => {
      if (task.completed) return;

      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate.getTime() - now.getTime() <= 0) {
          showNotification(
            'משימה לביצוע',
            `המשימה "${task.taskName}" עבור ${task.clientName} צריכה להתבצע היום`
          );
        }
      }

      if (task.reminderDate) {
        const reminderDate = new Date(task.reminderDate);
        if (reminderDate.getTime() - now.getTime() <= 0) {
          showNotification(
            'תזכורת למשימה',
            `תזכורת: המשימה "${task.taskName}" עבור ${task.clientName}`
          );
        }
      }
    });
  }, []);

  useEffect(() => {
    const setupNotifications = async () => {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }
    };
    
    setupNotifications();
    
    const unsubscribe = firebaseService.onTasksChange((updatedTasks) => {
      setTasks(updatedTasks);
      checkForDueTasksAndReminders(updatedTasks);
    });

    return () => unsubscribe();
  }, [checkForDueTasksAndReminders]);

  const showNotification = (title: string, body: string) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(title, { 
        body,
        icon: '/icons/icon-192x192.png'
      });
    }
  };

  // ... שאר הקוד נשאר זהה

  return (
    <div className="p-4">
      {/* ... שאר הקוד נשאר זהה */}
    </div>
  );
};

export default TaskManager;

  const handleAddTask = async () => {
    if (!newTask.clientName || !newTask.taskName || !newTask.dueDate) {
      alert('יש למלא את כל השדות הנדרשים');
      return;
    }

    const taskId = Date.now();
    const task = { ...newTask, id: taskId } as Task;

    await firebaseService.saveTask(task);
    
    if (task.reminderDate) {
      const reminderDate = new Date(task.reminderDate);
      const now = new Date();
      const timeUntilReminder = reminderDate.getTime() - now.getTime();
      
      if (timeUntilReminder > 0) {
        setTimeout(() => {
          showNotification(
            'תזכורת למשימה',
            `תזכורת: המשימה "${task.taskName}" עבור ${task.clientName}`
          );
        }, timeUntilReminder);
      }
    }

    setNewTask({
      clientName: '',
      taskName: '',
      dueDate: '',
      reminderDate: '',
      completed: false,
    });
  };

  const handleDeleteTask = async (id: number) => {
    await firebaseService.deleteTask(id);
  };

  const handleToggleComplete = async (id: number, completed: boolean) => {
    await firebaseService.updateTaskStatus(id, completed);
  };

  const sortedAndFilteredTasks = [...tasks]
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .filter((task) => {
      if (filter === 'all') return true;
      return filter === 'completed' ? task.completed : !task.completed;
    });

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">מנהל משימות</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="שם לקוח"
          value={newTask.clientName}
          onChange={(e) => setNewTask({ ...newTask, clientName: e.target.value })}
          className="border rounded p-2 mr-2"
        />
        <input
          type="text"
          placeholder="שם משימה"
          value={newTask.taskName}
          onChange={(e) => setNewTask({ ...newTask, taskName: e.target.value })}
          className="border rounded p-2 mr-2"
        />
        <input
          type="date"
          value={newTask.dueDate}
          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          className="border rounded p-2 mr-2"
        />
        <input
          type="datetime-local"
          value={newTask.reminderDate}
          onChange={(e) => setNewTask({ ...newTask, reminderDate: e.target.value })}
          className="border rounded p-2 mr-2"
        />
        <button 
          onClick={handleAddTask}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
        >
          הוסף משימה
        </button>
      </div>

      <div className="mb-4 space-x-2 rtl:space-x-reverse">
        <button
          onClick={() => setFilter('all')}
          className={`p-2 rounded transition-colors ${
            filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          כל המשימות
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`p-2 rounded transition-colors ${
            filter === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          משימות פעילות
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`p-2 rounded transition-colors ${
            filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          משימות שהושלמו
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 p-2">סטטוס</th>
              <th className="border border-gray-200 p-2">לקוח</th>
              <th className="border border-gray-200 p-2">משימה</th>
              <th className="border border-gray-200 p-2">תאריך יעד</th>
              <th className="border border-gray-200 p-2">תזכורת</th>
              <th className="border border-gray-200 p-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredTasks.map((task, index) => (
              <tr 
                key={task.id} 
                className={`${
                  index % 2 === 0 ? 'bg-blue-50' : 'bg-white'
                } ${
                  task.completed ? 'text-gray-500' : ''
                }`}
              >
                <td className="border border-gray-200 p-2 text-center">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleComplete(task.id, !task.completed)}
                    className="h-4 w-4 text-blue-600"
                  />
                </td>
                <td className="border border-gray-200 p-2">{task.clientName}</td>
                <td className="border border-gray-200 p-2">{task.taskName}</td>
                <td className="border border-gray-200 p-2">
                  {new Date(task.dueDate).toLocaleDateString('he-IL')}
                </td>
                <td className="border border-gray-200 p-2">
                  {task.reminderDate 
                    ? new Date(task.reminderDate).toLocaleString('he-IL')
                    : 'אין'}
                </td>
                <td className="border border-gray-200 p-2 text-center">
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors"
                  >
                    מחק
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskManager;