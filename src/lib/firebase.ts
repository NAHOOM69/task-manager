import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove } from 'firebase/database';
import { Task } from '@/types/task';

const firebaseConfig = {
  apiKey: "AIzaSyC6tF1s_LZojVTH7R9F1eE8dINA3pDR1vU",
  authDomain: "taskmanager-new.firebaseapp.com",
  databaseURL: "https://taskmanager-new-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "taskmanager-new",
  storageBucket: "taskmanager-new.firebasestorage.app",
  messagingSenderId: "601027888354",
  appId: "1:601027888354:web:5f388a5257ac59a5be8abb"
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  if (!/already exists/.test((error as Error).message)) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
  app = initializeApp(firebaseConfig, 'taskmanager-new');
}

const db = getDatabase(app);

export const firebaseService = {
  testConnection: async () => {
    const connRef = ref(db, '.info/connected');
    return new Promise((resolve, reject) => {
      onValue(connRef, (snap) => {
        if (snap.val() === true) {
          resolve(true);
        } else {
          reject(new Error('No connection'));
        }
      });
    });
  },

  onTasksChange: (onData: (tasks: Task[]) => void, onError: (error: Error) => void) => {
    const tasksRef = ref(db, 'tasks');
    try {
      const unsubscribe = onValue(tasksRef,
        (snapshot) => {
          const tasks: Task[] = [];
          snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val()) {
              tasks.push(childSnapshot.val());
            }
          });
          onData(tasks);
        },
        (error) => onError(error)
      );
      return unsubscribe;
    } catch (error) {
      onError(error as Error);
      return () => {};
    }
  },

  saveTask: async (task: Task) => {
    const taskRef = ref(db, `tasks/${task.id}`);
    await set(taskRef, task);
  },

  updateTask: async (task: Task) => {
    const taskRef = ref(db, `tasks/${task.id}`);
    await update(taskRef, task);
  },

  deleteTask: async (id: number) => {
    const taskRef = ref(db, `tasks/${id}`);
    await remove(taskRef);
  },

  updateTaskStatus: async (id: number, completed: boolean) => {
    const taskRef = ref(db, `tasks/${id}`);
    await update(taskRef, { completed });
  },

  clearAllTasks: async () => {
    const tasksRef = ref(db, 'tasks');
    await remove(tasksRef);
  }
};