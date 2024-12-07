import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  push,
  get,
  update,
  remove,
  onValue,
  DatabaseReference,
  DataSnapshot
} from "firebase/database";

// Define interfaces
export interface Task {
  id: string;
  clientName: string;
  taskName: string;
  dueDate: string;
  reminderDate?: string;
  completed: boolean;
  notified: boolean;
  courtDate?: string;
  court?: string;
  judge?: string;
  type: TaskType;
  caseId?: string;
}

export interface Case {
  id: string;
  clientName: string;
  caseNumber: string;
  legalNumber: string;
  subject: string;
  court: string;
  judge: string;
  nextHearing: string;
  status: CaseStatus;
  clientPhone: string;
  clientEmail: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export enum TaskType {
  COURT = 'court',
  MEETING = 'meeting',
  DEADLINE = 'deadline',
  OTHER = 'other'
}

export enum CaseStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  PENDING = 'pending',
  ARCHIVED = 'archived'
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

type FirebaseError = {
  code: string;
  message: string;
};

export class FirebaseService {
  private static handleError(error: unknown, operation: string): never {
    const fbError = error as FirebaseError;
    console.error(`Firebase ${operation} error:`, fbError);
    throw new Error(`${operation} failed: ${fbError.message}`);
  }

  private static async safeOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      return this.handleError(error, operationName);
    }
  }

  static async getAllTasks(): Promise<Task[]> {
    return this.safeOperation(async () => {
      const snapshot = await get(ref(database, "tasks"));
      return snapshot.exists() ? Object.values(snapshot.val()) : [];
    }, "getAllTasks");
  }

  static async getAllCases(): Promise<Case[]> {
    return this.safeOperation(async () => {
      const snapshot = await get(ref(database, "cases"));
      return snapshot.exists() ? Object.values(snapshot.val()) : [];
    }, "getAllCases");
  }

  static async saveTask(task: Omit<Task, 'id'>): Promise<string> {
    return this.safeOperation(async () => {
      const taskRef = push(ref(database, "tasks"));
      const newTask = { ...task, id: taskRef.key };
      await set(taskRef, newTask);
      return taskRef.key!;
    }, "saveTask");
  }

  static async saveCase(caseItem: Omit<Case, 'id'>): Promise<string> {
    return this.safeOperation(async () => {
      const caseRef = push(ref(database, "cases"));
      const newCase = { ...caseItem, id: caseRef.key };
      await set(caseRef, newCase);
      return caseRef.key!;
    }, "saveCase");
  }

  static async updateTask(taskId: string, taskData: Partial<Task>): Promise<void> {
    return this.safeOperation(async () => {
      const taskRef = ref(database, `tasks/${taskId}`);
      await update(taskRef, taskData);
    }, "updateTask");
  }

  static async updateCase(caseId: string, caseData: Partial<Case>): Promise<void> {
    return this.safeOperation(async () => {
      const caseRef = ref(database, `cases/${caseId}`);
      await update(caseRef, caseData);
    }, "updateCase");
  }

  static async deleteTask(taskId: string): Promise<void> {
    return this.safeOperation(async () => {
      const taskRef = ref(database, `tasks/${taskId}`);
      await remove(taskRef);
    }, "deleteTask");
  }

  static async deleteCase(caseId: string): Promise<void> {
    return this.safeOperation(async () => {
      // First, delete all related tasks
      const tasksSnapshot = await get(ref(database, "tasks"));
      if (tasksSnapshot.exists()) {
        const tasks = Object.entries(tasksSnapshot.val());
        const relatedTasks = tasks.filter(([_, task]) => (task as Task).caseId === caseId);
        
        await Promise.all(
          relatedTasks.map(([taskId]) => 
            remove(ref(database, `tasks/${taskId}`))
          )
        );
      }
      
      // Then delete the case itself
      const caseRef = ref(database, `cases/${caseId}`);
      await remove(caseRef);
    }, "deleteCase");
  }

  static async updateTaskStatus(taskId: string, newStatus: boolean): Promise<void> {
    return this.safeOperation(async () => {
      const taskRef = ref(database, `tasks/${taskId}`);
      await update(taskRef, { completed: newStatus });
    }, "updateTaskStatus");
  }

  static onTasksChange(callback: (tasks: Record<string, Task>) => void) {
    const tasksRef = ref(database, "tasks");
    return onValue(tasksRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : {};
callback(data);
    }, (error) => {
      console.error("Error in tasks listener:", error);
    });
  }

  static onCasesChange(callback: (cases: Record<string, Case>) => void) {
    const casesRef = ref(database, "cases");
    return onValue(casesRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : {};
callback(data);
    }, (error) => {
      console.error("Error in cases listener:", error);
    });
  }

  static async searchTasks(searchTerm: string): Promise<Task[]> {
    return this.safeOperation(async () => {
      const tasks = await this.getAllTasks();
      return tasks.filter(task => 
        task.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.taskName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, "searchTasks");
  }

  static async searchCases(searchTerm: string): Promise<Case[]> {
    return this.safeOperation(async () => {
      const cases = await this.getAllCases();
      return cases.filter(caseItem => 
        caseItem.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, "searchCases");
  }
}

export { app, database };