// lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  remove, 
  update, 
  DatabaseReference, 
  Database,
  get
} from "firebase/database";

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

// הקונפיגורציה הקבועה של Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC6tF1s_LZojVTH7R9F1eE8dINA3pDR1vU",
  authDomain: "taskmanager-new.firebaseapp.com",
  databaseURL: "https://taskmanager-new-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "taskmanager-new",
  storageBucket: "taskmanager-new.firebasestorage.app",
  messagingSenderId: "601027888354",
  appId: "1:601027888354:web:5f388a5257ac59a5be8abb"
};

class FirebaseService {
  private app: FirebaseApp;
  private database: Database;
  private tasksRef: DatabaseReference;
  private initialized: boolean = false;

  constructor() {
    try {
      console.log('Initializing Firebase with config:', {
        ...firebaseConfig,
        apiKey: '***' // מסתיר את המפתח בלוגים
      });

      // Initialize Firebase (ensure single instance)
      this.app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
      this.database = getDatabase(this.app);
      this.tasksRef = ref(this.database, 'tasks');
      this.initialized = true;

      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw new Error(`Failed to initialize Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Firebase service is not initialized');
    }
  }

  async testConnection(retries = 3): Promise<void> {
    this.ensureInitialized();
    
    const attemptConnection = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const connectedRef = ref(this.database, '.info/connected');
        let timeoutId: NodeJS.Timeout;
        let unsubscribe: (() => void) | null = null;

        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }
        };

        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Connection timeout after 10 seconds'));
        }, 10000);

        try {
          unsubscribe = onValue(connectedRef, 
            (snapshot) => {
              if (snapshot.val() === true) {
                cleanup();
                resolve();
              } else {
                cleanup();
                reject(new Error('Not connected to Firebase'));
              }
            }, 
            (error) => {
              cleanup();
              reject(error);
            }
          );
        } catch (error) {
          cleanup();
          reject(error);
        }
      });
    };

    // ניסיונות חוזרים עם השהייה
    for (let i = 0; i < retries; i++) {
      try {
        await attemptConnection();
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        // המתנה לפני ניסיון נוסף
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  private validateTask(task: Partial<Task>): Task {
    if (!task.clientName?.trim() || !task.taskName?.trim()) {
      throw new Error('Client name and task name are required');
    }

    return {
      id: Number(task.id) || Date.now(),
      clientName: task.clientName.trim(),
      taskName: task.taskName.trim(),
      dueDate: task.dueDate || new Date().toISOString().split('T')[0],
      type: task.type === 'hearing' ? 'hearing' : 'regular',
      completed: Boolean(task.completed),
      notified: Boolean(task.notified),
      reminderDate: task.reminderDate || '',
      courtDate: task.type === 'hearing' ? (task.courtDate || '') : '',
      court: task.type === 'hearing' ? (task.court?.trim() || '') : '',
      judge: task.type === 'hearing' ? (task.judge?.trim() || '') : ''
    };
  }

  async saveTask(task: Task): Promise<void> {
    this.ensureInitialized();
    
    try {
      const validatedTask = this.validateTask(task);
      const taskRef = ref(this.database, `tasks/${validatedTask.id}`);
      await set(taskRef, validatedTask);
    } catch (error) {
      console.error('Save task error:', error);
      throw new Error(`Failed to save task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateTask(task: Task): Promise<void> {
    this.ensureInitialized();

    try {
      const validatedTask = this.validateTask(task);
      const taskRef = ref(this.database, `tasks/${validatedTask.id}`);

      // Verify task exists
      const snapshot = await get(taskRef);
      if (!snapshot.exists()) {
        throw new Error(`Task with id ${validatedTask.id} not found`);
      }

      await update(taskRef, validatedTask);
    } catch (error) {
      console.error('Update task error:', error);
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateTaskStatus(taskId: number, completed: boolean): Promise<void> {
    this.ensureInitialized();

    try {
      const taskRef = ref(this.database, `tasks/${taskId}`);
      await update(taskRef, { completed });
    } catch (error) {
      console.error('Update task status error:', error);
      throw new Error(`Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteTask(taskId: number): Promise<void> {
    this.ensureInitialized();

    try {
      await remove(ref(this.database, `tasks/${taskId}`));
    } catch (error) {
      console.error('Delete task error:', error);
      throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearAllTasks(): Promise<void> {
    this.ensureInitialized();

    try {
      await remove(this.tasksRef);
    } catch (error) {
      console.error('Clear tasks error:', error);
      throw new Error(`Failed to clear tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  onTasksChange(
    callback: (tasks: Task[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    this.ensureInitialized();

    try {
      return onValue(
        this.tasksRef,
        (snapshot) => {
          try {
            const data = snapshot.val();
            const tasks: Task[] = data ? 
              Object.values(data)
                .filter((item: any) => item !== null && typeof item === 'object')
                .map((item: any) => this.validateTask(item)) 
              : [];
            callback(tasks);
          } catch (error) {
            console.error('Process tasks data error:', error);
            if (errorCallback) {
              errorCallback(error instanceof Error ? error : new Error('Failed to process tasks data'));
            }
          }
        },
        (error) => {
          console.error('Tasks listener error:', error);
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );
    } catch (error) {
      console.error('Setup tasks listener error:', error);
      if (errorCallback) {
        errorCallback(error instanceof Error ? error : new Error('Failed to set up tasks listener'));
      }
      return () => {};
    }
  }
}

// Export singleton instance and types
export const firebaseService = new FirebaseService();
export type { Task };