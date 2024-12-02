import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove, Database, DatabaseReference, Unsubscribe } from 'firebase/database';
import { Task } from '@/types/task';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

if (!firebaseConfig.databaseURL || !firebaseConfig.apiKey) {
  throw new Error('Missing required Firebase configuration');
}

class FirebaseService {
  private app: FirebaseApp;
  private db: Database;
  private static instance: FirebaseService;

  private constructor() {
    try {
      this.app = initializeApp(firebaseConfig);
      this.db = getDatabase(this.app);
      console.log('Firebase initialized successfully');
    } catch (error) {
      if (error instanceof Error && !/already exists/.test(error.message)) {
        console.error('Firebase initialization error:', error);
        throw error;
      }
      this.app = initializeApp(firebaseConfig, 'taskmanager-new');
      this.db = getDatabase(this.app);
    }
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  private getRef(path: string): DatabaseReference {
    return ref(this.db, path);
  }

  public testConnection = async (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const handleConnection = (snapshot: any) => {
        const isConnected = snapshot.val() === true;
        if (isConnected) {
          resolve(true);
        } else {
          reject(new Error('No connection to Firebase'));
        }
      };

      const handleError = (error: Error) => {
        reject(error);
      };

      onValue(this.getRef('.info/connected'), handleConnection, handleError);
    });
  };

  public onTasksChange = (onData: (tasks: Task[]) => void, onError: (error: Error) => void): Unsubscribe => {
    const handleSnapshot = (snapshot: any) => {
      try {
        const tasks: Task[] = [];
        snapshot.forEach((childSnapshot: any) => {
          const task = childSnapshot.val() as Task | null;
          if (task?.id) {
            tasks.push(task);
          }
        });
        onData(tasks);
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Error processing tasks'));
      }
    };

    return onValue(this.getRef('tasks'), handleSnapshot, onError);
  };

  public saveTask = async (task: Task): Promise<void> => {
    try {
      await set(this.getRef(`tasks/${task.id}`), task);
    } catch (error) {
      console.error('Save task error:', error);
      throw error;
    }
  };

  public updateTask = async (task: Task): Promise<void> => {
    try {
      await update(this.getRef(`tasks/${task.id}`), task);
    } catch (error) {
      console.error('Update task error:', error);
      throw error;
    }
  };

  public deleteTask = async (id: number): Promise<void> => {
    try {
      await remove(this.getRef(`tasks/${id}`));
    } catch (error) {
      console.error('Delete task error:', error);
      throw error;
    }
  };

  public updateTaskStatus = async (id: number, completed: boolean): Promise<void> => {
    try {
      await update(this.getRef(`tasks/${id}`), { completed });
    } catch (error) {
      console.error('Update task status error:', error);
      throw error;
    }
  };

  public clearAllTasks = async (): Promise<void> => {
    try {
      await remove(this.getRef('tasks'));
    } catch (error) {
      console.error('Clear all tasks error:', error);
      throw error;
    }
  };
}

export const firebaseService = FirebaseService.getInstance();