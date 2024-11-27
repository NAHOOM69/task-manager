import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDW-osvniH7Q5qG-DnH69TJHE_kdzHDfjA",
  authDomain: "task-manager211124.firebaseapp.com",
  databaseURL: "https://task-manager211124-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "task-manager211124",
  storageBucket: "task-manager211124.firebasestorage.app",
  messagingSenderId: "1090043201443",
  appId: "1:1090043201443:web:478e66399f3dbcf0ab3c16",
  measurementId: "G-8J9LQ6ZRGD"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export class FirebaseService {
  private tasksRef = ref(database, "tasks");

  async saveTask(task: any) {
    return set(ref(database, `tasks/${task.id}`), task);
  }

  async deleteTask(taskId: number) {
    return remove(ref(database, `tasks/${taskId}`));
  }

  async updateTaskStatus(taskId: number, completed: boolean) {
    return update(ref(database, `tasks/${taskId}`), { completed });
  }

// בתוך מחלקת FirebaseService הוסף את הפונקציה הזו

async updateTask(task: any): Promise<void> {
  const taskRef = ref(database, `tasks/${task.id}`);
  return update(taskRef, task);
}



  onTasksChange(callback: (tasks: any[]) => void) {
    return onValue(this.tasksRef, (snapshot) => {
      const data = snapshot.val();
      callback(data ? Object.values(data) : []);
    });
  }
}

export const firebaseService = new FirebaseService();
export { app, database };