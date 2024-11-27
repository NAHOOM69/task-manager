'use client';

import React, { useEffect, useState } from 'react';
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    clientName: '',
    taskName: '',
    dueDate: '',
    reminderDate: '',
    completed: false,
  });

  useEffect(() => {
    const unsubscribe = firebaseService.onTasksChange((updatedTasks) => {
      setTasks(updatedTasks);
    });
    return () => unsubscribe();
  }, []);

  const handleAddTask = async () => {
    if (!newTask.clientName || !newTask.taskName || !newTask.dueDate) {
      alert('יש למלא את כל השדות הנדרשים');
      return;
    }

    const taskId = Date.now();
    const task = { ...newTask, id: taskId } as Task;
    await firebaseService.saveTask(task);
    setNewTask({
      clientName: '',
      taskName: '',
      dueDate: '',
      reminderDate: '',
      completed: false,
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    await firebaseService.updateTask(editingTask);
    setEditingTask(null);
    alert(`המשימה "${editingTask.taskName}" עודכנה בהצלחה`);
  };

  const handleDeleteTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    await firebaseService.deleteTask(id);
    alert(`המשימה "${task?.taskName}" נמחקה בהצלחה`);
  };

  const handleToggleComplete = async (id: number, completed: boolean) => {
    await firebaseService.updateTaskStatus(id, completed);
    const task = tasks.find(t => t.id === id);
    alert(`המשימה "${task?.taskName}" ${completed ? 'הושלמה' : 'סומנה כלא הושלמה'}`);
  };

 // פונקציות חדשות לטיפול בתאריכים וגיבוי

const handleBackupTasks = () => {
  const tasksForExport = tasks.map(task => ({
    ...task,
    dueDate: task.dueDate.split('T')[0], // מוציא רק את התאריך
    reminderDate: task.reminderDate || null // מטפל במקרה שאין תזכורת
  }));
  
  const dataStr = JSON.stringify(tasksForExport, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

const handleImportTasks = async (importedTasks: any[]) => {
  try {
    for (const task of importedTasks) {
      // מוודא שיש תאריך תקין
      const dueDate = task.dueDate.includes('T') ? task.dueDate : `${task.dueDate}T00:00:00`;
      const reminderDate = task.reminderDate ? 
        (task.reminderDate.includes('T') ? task.reminderDate : `${task.reminderDate}T00:00:00`) : 
        null;

      await firebaseService.saveTask({
        ...task,
        dueDate,
        reminderDate
      });
    }
    alert('הנתונים נטענו בהצלחה');
  } catch (error) {
    alert('שגיאה בטעינת הקובץ');
    console.error(error);
  }
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

 // ... בתוך הקומפוננטה TaskManager

 return (
  <div className="p-4">
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-xl font-bold">מנהל משימות</h1>
      <div className="flex gap-2">
        <button onClick={handleBackupTasks} className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors">
          גיבוי משימות
        </button>
        <label htmlFor="importFile" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors cursor-pointer">
          טען מגיבוי
          <input
            id="importFile"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                  try {
                    const tasks = JSON.parse(event.target?.result as string);
                    await handleImportTasks(tasks);
                  } catch (error) {
                    alert('שגיאה בטעינת הקובץ');
                    console.error(error);
                  }
                };
                reader.readAsText(file);
              }
            }}
          />
        </label>
      </div>
    </div>
    );

<input
  id="importFile"
  type="file"
  accept=".json"
  className="hidden"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const tasks = JSON.parse(event.target?.result as string);
          await handleImportTasks(tasks);
        } catch (error) {
          alert('שגיאה בטעינת הקובץ');
          console.error(error);
        }
      };
      reader.readAsText(file);
    }
  }}
/>

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
              <tr key={task.id} className={index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                <td className="border border-gray-200 p-2 text-center">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleComplete(task.id, !task.completed)}
                    className="h-4 w-4 text-blue-600"
                  />
                </td>
                <td className="border border-gray-200 p-2">
                  {editingTask?.id === task.id ? (
                    <input
                      type="text"
                      value={editingTask.clientName}
                      onChange={(e) => setEditingTask({ ...editingTask, clientName: e.target.value })}
                      className="border rounded p-1 w-full"
                    />
                  ) : (
                    task.clientName
                  )}
                </td>
                <td className="border border-gray-200 p-2">
                  {editingTask?.id === task.id ? (
                    <input
                      type="text"
                      value={editingTask.taskName}
                      onChange={(e) => setEditingTask({ ...editingTask, taskName: e.target.value })}
                      className="border rounded p-1 w-full"
                    />
                  ) : (
                    task.taskName
                  )}
                </td>
                <td className="border border-gray-200 p-2">
                  {editingTask?.id === task.id ? (
                    <input
                      type="date"
                      value={editingTask.dueDate}
                      onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                      className="border rounded p-1"
                    />
                  ) : (
                    new Date(task.dueDate).toLocaleDateString('he-IL')
                  )}
                </td>
                <td className="border border-gray-200 p-2">
                  {editingTask?.id === task.id ? (
                    <input
                      type="datetime-local"
                      value={editingTask.reminderDate}
                      onChange={(e) => setEditingTask({ ...editingTask, reminderDate: e.target.value })}
                      className="border rounded p-1"
                    />
                  ) : (
                    task.reminderDate ? new Date(task.reminderDate).toLocaleString('he-IL') : 'אין'
                  )}
                </td>
                <td className="border border-gray-200 p-2 text-center space-x-2 rtl:space-x-reverse">
                  {editingTask?.id === task.id ? (
                    <>
                      <button
                        onClick={handleUpdateTask}
                        className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors mr-2"
                      >
                        שמור
                      </button>
                      <button
                        onClick={() => setEditingTask(null)}
                        className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition-colors"
                      >
                        בטל
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditTask(task)}
                        className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 transition-colors mr-2"
                      >
                        ערוך
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors"
                      >
                        מחק
                      </button>
                    </>
                  )}
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