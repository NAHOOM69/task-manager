import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove, update } from "firebase/database";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDW-osvniH7Q5qG-DnH69TJHE_kdzHDfjA",
  authDomain: "task-manager211124.firebaseapp.com",
  databaseURL: "https://task-manager211124-default-rtdb.firebaseio.com",
  projectId: "task-manager211124",
  storageBucket: "task-manager211124.appspot.com",
  messagingSenderId: "1090043201443",
  appId: "1:1090043201443:web:478e66399f3dbcf0ab3c16"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export class FirebaseService {
  private tasksRef = ref(database, "tasks");

  // הוספת משימה חדשה
  async saveTask(task: any): Promise<void> {
    try {
      await set(ref(database, `tasks/${task.id}`), task);
      console.log("Task saved successfully:", task);
    } catch (error) {
      console.error("Error saving task:", error);
      throw error;
    }
  }

  // מחיקת משימה
  async deleteTask(taskId: number): Promise<void> {
    try {
      await remove(ref(database, `tasks/${taskId}`));
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }

  // עדכון סטטוס משימה
  async updateTaskStatus(taskId: number, completed: boolean): Promise<void> {
    try {
      await update(ref(database, `tasks/${taskId}`), { completed });
    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  }

  // האזנה לשינויים ברשימת המשימות
  onTasksChange(callback: (tasks: any[]) => void): () => void {
    const unsubscribe = onValue(this.tasksRef, (snapshot) => {
      const data = snapshot.val();
      const tasks = data ? Object.values(data) : [];
      callback(tasks);
    });
    return unsubscribe;
  }

  // בקשת הרשאות התראות
  async requestNotificationPermission(): Promise<string | null> {
    try {
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: "BAi6iS6NtZopagHTG5wa0AQVDIcWxlM6ph28Y_PeRxP_rVqij3mNGqsdr3VAaApRvo3JZSNyjziBEaEt2uKrORs"
      });
      return token;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  }
}

export const firebaseService = new FirebaseService();
export { app, database };