'use client';
import React, { useEffect, useState } from 'react';
import { firebaseService } from '@/lib/firebase';

// ממשק לייצוג משימה
interface Task {
  id: number;
  clientName: string;
  taskName: string;
  dueDate: string;
  reminderDate?: string;
  completed: boolean;
  notified?: boolean;
}

// ממשק למשימה חדשה
type NewTask = Omit<Task, 'id' | 'notified'>;

// סטטוס סינון
type FilterStatus = 'all' | 'active' | 'completed';

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<NewTask>({
    clientName: '',
    taskName: '',
    dueDate: '',
    reminderDate: '',
    completed: false,
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // האזנה לשינויים ב-Firebase
  useEffect(() => {
    const unsubscribe = firebaseService.onTasksChange((updatedTasks) => {
      const sortedTasks = updatedTasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      setTasks(sortedTasks);
    });

    return () => unsubscribe();
  }, []);

  // הוספת משימה חדשה
  const handleAddTask = async () => {
    if (!newTask.clientName || !newTask.taskName || !newTask.dueDate) {
      alert('יש למלא את כל השדות הדרושים.');
      return;
    }
    const task: Task = {
      id: Date.now(),
      ...newTask,
      completed: false,
      notified: false,
    };
    await firebaseService.saveTask(task);
    resetForm();
  };

  // עריכת משימה
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      clientName: task.clientName,
      taskName: task.taskName,
      dueDate: task.dueDate,
      reminderDate: task.reminderDate || '',
      completed: task.completed,
    });
  };

  // שמירת משימה לאחר עריכה
  const handleSaveEdit = async () => {
    if (editingTask) {
      const updatedTask = {
        ...editingTask,
        ...newTask,
      };
      await firebaseService.saveTask(updatedTask);
      setEditingTask(null);
      resetForm();
    }
  };

  // מחיקת משימה
  const handleDeleteTask = async (taskId: number) => {
    if (confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
      await firebaseService.deleteTask(taskId);
    }
  };

  // שינוי סטטוס המשימה (השלמה/לא הושלמה)
  const handleToggleCompletion = async (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    await firebaseService.saveTask(updatedTask);
  };

  // איפוס הטופס
  const resetForm = () => {
    setNewTask({
      clientName: '',
      taskName: '',
      dueDate: '',
      reminderDate: '',
      completed: false,
    });
    setEditingTask(null);
  };

  return (
    <div className="container mx-auto p-4 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">מנהל משימות</h1>

      {/* טופס הוספת/עריכת משימה */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">
          {editingTask ? 'עריכת משימה' : 'הוספת משימה חדשה'}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            editingTask ? handleSaveEdit() : handleAddTask();
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="שם לקוח"
              value={newTask.clientName}
              onChange={(e) => setNewTask({ ...newTask, clientName: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="שם משימה"
              value={newTask.taskName}
              onChange={(e) => setNewTask({ ...newTask, taskName: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="datetime-local"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="datetime-local"
              value={newTask.reminderDate}
              onChange={(e) => setNewTask({ ...newTask, reminderDate: e.target.value })}
              className="input-field"
            />
          </div>
          <button type="submit" className="btn-primary mt-4">
            {editingTask ? 'שמור שינויים' : 'הוסף משימה'}
          </button>
        </form>
      </div>

      {/* חיפוש וסינון */}
      <div className="flex items-center gap-4 bg-white p-4 rounded shadow">
        <input
          type="text"
          placeholder="חפש משימה..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="select-field"
        >
          <option value="all">הכל</option>
          <option value="active">פעילות</option>
          <option value="completed">הושלמו</option>
        </select>
      </div>

      {/* טבלת משימות */}
      <table className="w-full text-right bg-white rounded shadow">
        <thead className="bg-gray-200">
          <tr>
            <th>סטטוס</th>
            <th>לקוח</th>
            <th>משימה</th>
            <th>תאריך יעד</th>
            <th>תזכורת</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {tasks
            .filter((task) => {
              if (filterStatus === 'completed') return task.completed;
              if (filterStatus === 'active') return !task.completed;
              return true;
            })
            .filter((task) =>
              task.clientName.includes(searchTerm) || task.taskName.includes(searchTerm)
            )
            .map((task) => (
              <tr key={task.id} className={task.completed ? 'bg-green-100' : 'bg-white'}>
                <td>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleCompletion(task)}
                  />
                </td>
                <td>{task.clientName}</td>
                <td>{task.taskName}</td>
                <td>{task.dueDate}</td>
                <td>{task.reminderDate || '-'}</td>
                <td>
                  <button onClick={() => handleEditTask(task)}>ערוך</button>
                  <button onClick={() => handleDeleteTask(task.id)}>מחק</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskManager;
