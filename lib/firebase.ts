// ייבוא הפונקציות הדרושות מ-SDK של Firebase
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove, update } from "firebase/database";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// קובץ קונפיגורציה של Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDW-osvniH7Q5qG-DnH69TJHE_kdzHDfjA",
  authDomain: "task-manager211124.firebaseapp.com",
  databaseURL: "https://task-manager211124-default-rtdb.firebaseio.com", // כתובת ה-Database שלך
  projectId: "task-manager211124",
  storageBucket: "task-manager211124.appspot.com",
  messagingSenderId: "1090043201443",
  appId: "1:1090043201443:web:478e66399f3dbcf0ab3c16",
};

// אתחול Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
let messaging: any;

if (typeof window !== "undefined") {
  messaging = getMessaging(app);
}

// מחלקה לניהול Firebase
export class FirebaseService {
  private tasksRef = ref(database, "tasks");

  // הוספת משימה חדשה
  async saveTask(task: any): Promise<void> {
    try {
      await set(ref(database, `tasks/${task.id}`), task);
      console.log("Task saved successfully:", task);
    } catch (error) {
      console.error("Error saving task:", error);
    }
  }

  // מחיקת משימה
  async deleteTask(taskId: number): Promise<void> {
    try {
      await remove(ref(database, `tasks/${taskId}`));
      console.log(`Task ${taskId} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }

  // עדכון סטטוס משימה (לדוגמה: הושלמה)
  async updateTaskStatus(taskId: number, completed: boolean): Promise<void> {
    try {
      await update(ref(database, `tasks/${taskId}`), { completed });
      console.log(`Task ${taskId} status updated to ${completed ? "completed" : "active"}`);
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  }

  // האזנה לשינויים ברשימת המשימות בזמן אמת
  onTasksChange(callback: (tasks: any[]) => void): () => void {
    const unsubscribe = onValue(this.tasksRef, (snapshot) => {
      const data = snapshot.val();
      const tasks = data ? Object.values(data) : [];
      callback(tasks);
    });
    return () => unsubscribe();
  }

  // בקשת הרשאה להתראות וקבלת טוקן
  async requestNotificationPermission(): Promise<string | null> {
    if (typeof window === "undefined") {
      console.error("Firebase Messaging לא נתמך בצד השרת");
      return null;
    }

    try {
      const token = await getToken(messaging, {
        vapidKey: "BAi6iS6NtZopagHTG5wa0AQVDIcWxlM6ph28Y_PeRxP_rVqij3mNGqsdr3VAaApRvo3JZSNyjziBEaEt2uKrORs",
      });
      console.log("FCM Token:", token);
      return token;
    } catch (error: any) {
      console.error("Error getting FCM token:", error.code, error.message);
      return null;
    }
  }

  // האזנה להתראות Firebase
  onMessageListener(): Promise<any> {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        console.error("onMessageListener can only be used in the browser.");
        resolve(null);
        return;
      }

      onMessage(messaging, (payload) => {
        console.log("Message received:", payload);
        resolve(payload);
      });
    });
  }
}

// ייצוא מופע יחיד של FirebaseService
export const firebaseService = new FirebaseService();

// ייצוא של משתנים נוספים לשימוש
export { app, database };
