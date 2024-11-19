import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, remove, Database } from 'firebase/database';
import { Task } from '../types/task';

const firebaseConfig = {
  apiKey: "AIzaSyAPB7BtGlY2-7m5TaIpoz4duC1Yv7IEGNU",
  authDomain: "task-manager181124.firebaseapp.com",
  databaseURL: "https://task-manager181124-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "task-manager181124",
  storageBucket: "task-manager181124.firebasestorage.app",
  messagingSenderId: "212734040741",
  appId: "1:212734040741:web:fc416a1ff480bb255d0b4c",
  measurementId: "G-ED32K3SGXQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export class FirebaseService {
  private db: Database;
  private tasksRef: string = 'tasks';

  constructor() {
    this.db = database;
  }

  // הוספה או עדכון של משימה
  async saveTask(task: Task): Promise<void> {
    try {
      await set(ref(this.db, `${this.tasksRef}/${task.id}`), task);
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  }

  // מחיקת משימה
  async deleteTask(taskId: number): Promise<void> {
    try {
      await remove(ref(this.db, `${this.tasksRef}/${taskId}`));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // האזנה לשינויים במשימות
  onTasksChange(callback: (tasks: Task[]) => void): () => void {
    const tasksRef = ref(this.db, this.tasksRef);
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      const tasks: Task[] = data ? Object.values(data) : [];
      callback(tasks.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
    });

    return () => unsubscribe();
  }

  // שמירת כל המשימות
  async saveAllTasks(tasks: Task[]): Promise<void> {
    try {
      const tasksObject = tasks.reduce((acc, task) => {
        acc[task.id] = task;
        return acc;
      }, {} as { [key: string]: Task });

      await set(ref(this.db, this.tasksRef), tasksObject);
    } catch (error) {
      console.error('Error saving all tasks:', error);
      throw error;
    }
  }

  // עדכון סטטוס משימה
  async updateTaskStatus(taskId: number, completed: boolean): Promise<void> {
    try {
      const taskRef = ref(this.db, `${this.tasksRef}/${taskId}/completed`);
      await set(taskRef, completed);
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // עדכון סטטוס התראה
  async updateNotificationStatus(taskId: number, notified: boolean): Promise<void> {
    try {
      const taskRef = ref(this.db, `${this.tasksRef}/${taskId}/notified`);
      await set(taskRef, notified);
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  }
}

// יצירת מופע יחיד של השירות
export const firebaseService = new FirebaseService();