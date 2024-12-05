import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  push,
  get,
  update,
  remove,
  onValue, // ייבוא onValue
} from "firebase/database";


export { app };


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

export { database };


export const firebaseService = {
  // פונקציה לקבלת כל המשימות
  async getAllTasks() {
    const snapshot = await get(ref(database, "tasks"));
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  },

  // פונקציה לקבלת כל התיקים
  async getAllCases() {
    const snapshot = await get(ref(database, "cases"));
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  },

  // פונקציה לשמירת משימה
  async saveTask(task: any) {
    const taskRef = push(ref(database, "tasks"));
    await set(taskRef, task);
  },

  // פונקציה לשמירת תיק
  async saveCase(caseItem: any) {
    const caseRef = push(ref(database, "cases"));
    await set(caseRef, caseItem);
  },

  // פונקציה לעדכון משימה
  async updateTask(taskId: string, taskData: any) {
    const taskRef = ref(database, `tasks/${taskId}`);
    await update(taskRef, taskData);
  },

  // פונקציה לעדכון תיק
  async updateCase(caseId: string, caseData: any) {
    const caseRef = ref(database, `cases/${caseId}`);
    await update(caseRef, caseData);
  },

  // פונקציה למחיקת משימה
  async deleteTask(taskId: string) {
    const taskRef = ref(database, `tasks/${taskId}`);
    await remove(taskRef);
  },

  // פונקציה למחיקת תיק
  async deleteCase(caseId: string) {
    const caseRef = ref(database, `cases/${caseId}`);
    await remove(caseRef);
  },

  async updateTaskStatus(taskId: string, newStatus: boolean): Promise<void> {
    const taskRef = ref(database, `tasks/${taskId}`);
    await update(taskRef, { completed: newStatus });
  },

  // מאזין לשינויים במשימות
  onTasksChange(callback: (tasks: any[]) => void) {
    const tasksRef = ref(database, "tasks");
    return onValue(tasksRef, (snapshot) => {
      const data = snapshot.exists() ? Object.values(snapshot.val()) : [];
      callback(data);
    });
  },

  // מאזין לשינויים בתיקים
  onCasesChange(callback: (cases: any[]) => void) {
    const casesRef = ref(database, "cases");
    return onValue(casesRef, (snapshot) => {
      const data = snapshot.exists() ? Object.values(snapshot.val()) : [];
      callback(data);
    });
  },
};
