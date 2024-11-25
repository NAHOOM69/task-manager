'use client';

import React, { useEffect, useState } from 'react';
import { firebaseService } from '../lib/firebase'; // ייבוא השירות מ-Firebase

// ממשק המגדיר את מבנה המשימה
interface Task {
  id: number;
  clientName: string;
  taskName: string;
  dueDate: string;
  reminderDate?: string;
  completed: boolean;
}

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]); // מצב המשימות
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all'); // מסנן התצוגה
  const [newTask, setNewTask] = useState<Partial<Task>>({
    clientName: '',
    taskName: '',
    dueDate: '',
    reminderDate: '',
    completed: false,
  }); // משימה חדשה
  useEffect(() => {
    // האזנה לשינויים במשימות בזמן אמת
    const unsubscribe = firebaseService.onTasksChange((updatedTasks) => {
      setTasks(updatedTasks);
    });

    return () => unsubscribe(); // ביטול ההאזנה כאשר הקומפוננטה מסיימת את הפעולה
  }, []);
  // הוספת משימה חדשה
  const handleAddTask = async () => {
    if (!newTask.clientName || !newTask.taskName || !newTask.dueDate) {
      alert('יש למלא את כל השדות הנדרשים');
      return;
    }

    const taskId = Date.now(); // יצירת מזהה ייחודי מבוסס זמן
    const task = { ...newTask, id: taskId };

    await firebaseService.saveTask(task); // שמירת המשימה ב-Firebase
    setNewTask({ clientName: '', taskName: '', dueDate: '', reminderDate: '', completed: false }); // איפוס השדות
  };

  // מחיקת משימה
  const handleDeleteTask = async (id: number) => {
    await firebaseService.deleteTask(id);
  };

  // שינוי סטטוס משימה (הושלמה או פעילה)
  const handleToggleComplete = async (id: number, completed: boolean) => {
    await firebaseService.updateTaskStatus(id, completed);
  };

  // סינון המשימות להצגה בטבלה
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return filter === 'completed' ? task.completed : !task.completed;
  });
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">מנהל משימות</h1>

      {/* טופס הוספת משימה */}
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
        <button onClick={handleAddTask} className="bg-blue-500 text-white p-2 rounded">
          הוסף משימה
        </button>
      </div>

      {/* אפשרויות סינון */}
      <div className="mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          כל המשימות
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`p-2 rounded ml-2 ${
            filter === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          משימות פעילות
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`p-2 rounded ml-2 ${
            filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          משימות שהושלמו
        </button>
      </div>
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
          {filteredTasks.map((task, index) => (
            <tr key={task.id} className={index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
              <td className="border border-gray-200 p-2 text-center">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleComplete(task.id, !task.completed)}
                />
              </td>
              <td className="border border-gray-200 p-2">{task.clientName}</td>
              <td className="border border-gray-200 p-2">{task.taskName}</td>
              <td className="border border-gray-200 p-2">{task.dueDate}</td>
              <td className="border border-gray-200 p-2">{task.reminderDate || 'אין'}</td>
              <td className="border border-gray-200 p-2 text-center">
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="bg-red-500 text-white p-2 rounded"
                >
                  מחק
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskManager;
