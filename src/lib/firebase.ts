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
import { Task, TaskType, TaskInput } from '@/types/Task';
import { Case, CaseStatus } from '@/types/Case';
import Papa from 'papaparse';
// נוסיף ממשק לנתוני CSV
interface CsvCaseData {
  'לקוח': string;
  'מספר תיק': string;
  'מספר תיק אזרחי': string;
  'בית משפט': string;
  'שופט': string;
  'תאריך דיון אחרון': string;
  'אימייל': string;
  'לקוח טלפון': string;
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

class FirebaseService {
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

  private static cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: Partial<T> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== '' && value !== null) {
        (cleaned as any)[key] = value;
      }
    }
    return cleaned;
}

  static async getAllTasks(): Promise<Task[]> {
    return this.safeOperation(async () => {
      const snapshot = await get(ref(database, "tasks"));
      if (!snapshot.exists()) return [];
      const tasks = Object.entries(snapshot.val()).map(([key, value]) => ({
        ...(value as Task),
        id: key
      }));
      return tasks;
    }, "getAllTasks");
  }

  static async getAllCases(): Promise<Case[]> {
    return this.safeOperation(async () => {
      const snapshot = await get(ref(database, "cases"));
      if (!snapshot.exists()) return [];
      const cases = Object.entries(snapshot.val()).map(([key, value]) => ({
        ...(value as Case),
        id: key
      }));
      return cases;
    }, "getAllCases");
  }

  static async saveTask(taskData: Omit<Task, 'id' | 'completed' | 'notified'>): Promise<string> {
    return this.safeOperation(async () => {
      const cleanTask = {
        clientName: taskData.clientName,
        taskName: taskData.taskName,
        dueDate: taskData.dueDate,
        type: taskData.type,
        reminderDate: taskData.reminderDate || '',
        court: taskData.court || '',
        judge: taskData.judge || '',
        courtDate: taskData.courtDate || '',
        caseId: taskData.caseId || '',
        caseNumber: taskData.caseNumber || '',
        legalNumber: taskData.legalNumber || '',
        completed: false,
        notified: false
      };
  
      const taskRef = push(ref(database, "tasks"));
      const newTask = { 
        ...cleanTask, 
        id: taskRef.key
      };
  
      await set(taskRef, newTask);
      return taskRef.key!;
    }, "saveTask");
  }

  static async saveCase(caseInput: Omit<Case, 'id'>): Promise<string> {
    return this.safeOperation(async () => {
      const caseRef = push(ref(database, "cases"));
      const cleanCase = this.cleanObject(caseInput);
      
      const newCase = {
        ...cleanCase,
        id: caseRef.key,
        status: cleanCase.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await set(caseRef, newCase);
      return caseRef.key!;
    }, "saveCase");
  }


  static async getTask(taskId: string): Promise<Task | null> {
    return this.safeOperation(async () => {
      const taskRef = ref(database, `tasks/${taskId}`);
      const snapshot = await get(taskRef);
      if (!snapshot.exists()) return null;
      return { ...snapshot.val(), id: taskId };
    }, "getTask");
  }


  static async updateCase(caseId: string, caseData: Partial<Case>): Promise<void> {
    return this.safeOperation(async () => {
      const cleanCase = this.cleanObject(caseData);
      const updateData = {
        ...cleanCase,
        updatedAt: new Date().toISOString()
      };
      const caseRef = ref(database, `cases/${caseId}`);
      await update(caseRef, updateData);
    }, "updateCase");
  }

  static async deleteCase(caseId: string): Promise<void> {
    return this.safeOperation(async () => {
      try {
        // בדיקה אם התיק קיים ומציאת המזהה האמיתי
        const casesRef = ref(database, 'cases');
        const casesSnapshot = await get(casesRef);
        
        if (casesSnapshot.exists()) {
          const cases = casesSnapshot.val();
          // מחפשים את המפתח של התיק לפי ה-id שלו
          const firebaseKey = Object.keys(cases).find(key => 
            cases[key].id === caseId
          );
  
          if (firebaseKey) {
            console.log('Found Firebase key:', firebaseKey);
            const caseRef = ref(database, `cases/${firebaseKey}`);
            await remove(caseRef);
            return;
          }
        }
        throw new Error('Case not found');
      } catch (error) {
        console.error('Delete operation failed:', error);
        throw error;
      }
    }, "deleteCase");
  }
  
  static async deleteTask(taskId: string): Promise<void> {
    return this.safeOperation(async () => {
      try {
        const tasksRef = ref(database, 'tasks');
        const tasksSnapshot = await get(tasksRef);
        
        if (tasksSnapshot.exists()) {
          const tasks = tasksSnapshot.val();
          // מחפשים את המפתח של המשימה לפי ה-id שלה
          const firebaseKey = Object.keys(tasks).find(key => 
            tasks[key].id === taskId
          );
  
          if (firebaseKey) {
            console.log('Found Firebase key:', firebaseKey);
            const taskRef = ref(database, `tasks/${firebaseKey}`);
            await remove(taskRef);
            return;
          }
        }
        throw new Error('Task not found');
      } catch (error) {
        console.error('Delete operation failed:', error);
        throw error;
      }
    }, "deleteTask");
  }


  static async updateTask(taskId: string, taskData: Partial<Task>): Promise<void> {
    return this.safeOperation(async () => {
      try {
        // קודם נחפש את המשימה בכל המשימות
        const tasksRef = ref(database, 'tasks');
        const tasksSnapshot = await get(tasksRef);
        
        if (!tasksSnapshot.exists()) {
          throw new Error('No tasks found in database');
        }
  
        const tasks = tasksSnapshot.val();
        // מחפשים את המפתח של המשימה לפי ה-id
        const firebaseKey = Object.keys(tasks).find(key => 
          tasks[key].id === taskId || key === taskId
        );
  
        if (!firebaseKey) {
          throw new Error(`Task with ID ${taskId} not found`);
        }
  
        // עכשיו כשיש לנו את המפתח הנכון, נבצע את העדכון
        const taskRef = ref(database, `tasks/${firebaseKey}`);
        const existingTask = tasks[firebaseKey];
  
        const updatedData = {
          ...existingTask,
          ...taskData,
          id: taskId,
          completed: taskData.completed ?? existingTask.completed ?? false,
          notified: taskData.notified ?? existingTask.notified ?? false,
          caseNumber: taskData.caseNumber ?? existingTask.caseNumber ?? '',
          legalNumber: taskData.legalNumber ?? existingTask.legalNumber ?? '',
          court: taskData.court ?? existingTask.court ?? '',
          judge: taskData.judge ?? existingTask.judge ?? '',
          courtDate: taskData.courtDate ?? existingTask.courtDate ?? '',
          reminderDate: taskData.reminderDate ?? existingTask.reminderDate ?? '',
          updatedAt: new Date().toISOString()
        };
  
        // הסרת שדות undefined
        Object.keys(updatedData).forEach(key => {
          if (updatedData[key] === undefined) {
            delete updatedData[key];
          }
        });
  
        await update(taskRef, updatedData);
        console.log('Task updated successfully:', { firebaseKey, updatedData });
      } catch (error) {
        console.error('Error updating task:', error);
        throw error;
      }
    }, "updateTask");
  }









  static async updateTaskStatus(taskId: string, newStatus: boolean): Promise<void> {
    return this.safeOperation(async () => {
      const taskRef = ref(database, `tasks/${taskId}`);
      await update(taskRef, { 
        completed: newStatus,
        updatedAt: new Date().toISOString()
      });
    }, "updateTaskStatus");
  }

// בקובץ firebase.ts, נעדכן את הפונקציה onTasksChange:

static onTasksChange(callback: (tasks: Record<string, Task>) => void) {
  const tasksRef = ref(database, "tasks");
  
  return onValue(tasksRef, (snapshot) => {
    try {
      if (!snapshot.exists()) {
        callback({});
        return;
      }

      const data = snapshot.val();
      const formattedData = Object.entries(data).reduce<Record<string, Task>>((acc, [key, value]: [string, any]) => {
        if (!value) return acc;

        acc[key] = {
          id: value.id || key,
          clientName: value.clientName || '',
          taskName: value.taskName || '',
          dueDate: value.dueDate || '',
          completed: Boolean(value.completed),
          notified: Boolean(value.notified),
          type: value.type || TaskType.REGULAR,
          reminderDate: value.reminderDate || '',
          court: value.court || '',
          judge: value.judge || '',
          courtDate: value.courtDate || '',
          caseId: value.caseId || '',
          caseNumber: value.caseNumber || '',
          legalNumber: value.legalNumber || ''
        };
        
        return acc;
      }, {});

      callback(formattedData);
    } catch (error) {
      console.error('Error in tasks formatting:', error);
      callback({});
    }
  }, (error) => {
    console.error("Error in tasks listener:", error);
    callback({});
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
      if (!searchTerm.trim()) return [];
      
      const tasks = await this.getAllTasks();
      const searchLower = searchTerm.toLowerCase();
      
      return tasks.filter(task => 
        task.clientName.toLowerCase().includes(searchLower) ||
        task.taskName.toLowerCase().includes(searchLower) ||
        (task.court?.toLowerCase().includes(searchLower) || '') ||
        (task.judge?.toLowerCase().includes(searchLower) || '')
      );
    }, "searchTasks");
  }

// firebase.ts - הוספת פונקציות חדשות

// תוסיף ב-FirebaseService class
static async restoreData(data: { tasks: Task[], cases: Case[] }): Promise<void> {
  return this.safeOperation(async () => {
    // מחיקת כל הנתונים הקיימים
    await remove(ref(database, 'tasks'));
    await remove(ref(database, 'cases'));
    
    // העלאת הנתונים החדשים
    const promises: Promise<void>[] = [];
    
    // העלאת תיקים
    for (const case_ of data.cases) {
      const caseRef = ref(database, `cases/${case_.id}`);
      promises.push(set(caseRef, case_));
    }
    
    // העלאת משימות
    for (const task of data.tasks) {
      const taskRef = ref(database, `tasks/${task.id}`);
      promises.push(set(taskRef, task));
    }
    
    await Promise.all(promises);
  }, "restoreData");
}

  static async searchCases(searchTerm: string): Promise<Case[]> {
    return this.safeOperation(async () => {
      if (!searchTerm?.trim()) return [];
      
      const cases = await this.getAllCases();
      const searchLower = searchTerm.toLowerCase();
      
      return cases.filter(caseItem => {
        // טיפול בערכים חסרים
        const clientName = caseItem?.clientName || '';
        const caseNumber = caseItem?.caseNumber || '';
        const subject = caseItem?.subject || '';
        const court = caseItem?.court || '';
        const judge = caseItem?.judge || '';
  
        return (
          clientName.toLowerCase().includes(searchLower) ||
          caseNumber.toLowerCase().includes(searchLower) ||
          subject.toLowerCase().includes(searchLower) ||
          court.toLowerCase().includes(searchLower) ||
          judge.toLowerCase().includes(searchLower)
        );
      });
    }, "searchCases");
  }

  static async importLegacyData(tasks: any[]): Promise<void> {
    return this.safeOperation(async () => {
      // מחיקת כל הנתונים הקיימים
      await remove(ref(database, 'tasks'));
      
      // העלאת כל המשימות
      const promises = tasks.map(task => {
        const taskRef = ref(database, `tasks/-${task.id}`);
        
        // המרת המשימה למבנה הנכון
        const formattedTask = {
          id: String(task.id),
          clientName: task.clientName || '',
          taskName: task.taskName || '',
          dueDate: task.dueDate || '',
          reminderDate: task.reminderDate || '',
          completed: Boolean(task.completed),
          notified: Boolean(task.notified),
          court: task.court || '',
          judge: task.judge || '',
          courtDate: task.courtDate || '',
          type: task.type === 'hearing' ? 'HEARING' : 'REGULAR'
        };
  
        return set(taskRef, formattedTask);
      });
  
      await Promise.all(promises);
      console.log('Successfully imported', tasks.length, 'tasks');
    }, "importLegacyData");
  }

  static async importCasesFromCSV(csvContent: string): Promise<void> {
    return this.safeOperation(async () => {
      const parseResult = Papa.parse<CsvCaseData>(csvContent, {
        header: true,
        skipEmptyLines: true
      });
  
      const cases = parseResult.data.map((row: CsvCaseData) => ({
        clientName: row['לקוח'] || '',
        caseNumber: row['מספר תיק אזרחי'] || '',
        legalNumber: row['מספר תיק'] || '',
        court: row['בית משפט'] || '',
        judge: row['שופט'] || '',
        nextHearing: row['תאריך דיון אחרון'] || '',
        clientPhone: row['לקוח טלפון'] || '',
        clientEmail: row['אימייל'] || '',
        status: 'active' as CaseStatus,
        subject: 'ייבוא אוטומטי', // שדה חובה - ערך ברירת מחדל
        notes: '',                // שדה חובה - ערך ברירת מחדל
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
  
      // נשמור כל תיק בנפרד
      const promises = cases.map(caseData => this.saveCase(caseData));
      
      await Promise.all(promises);
      console.log('Successfully imported', cases.length, 'cases');
    }, "importCasesFromCSV");
  }
}



const handleRestore = async (file: File) => {
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // בדיקת תקינות המבנה
        if (!data.tasks || !data.cases) {
          throw new Error('Invalid backup file structure');
        }

        // העלאת הנתונים
        await FirebaseService.restoreData(data);
        alert('שחזור הנתונים הושלם בהצלחה');
      } catch (error) {
        console.error('Error parsing backup file:', error);
        alert('שגיאה בקריאת קובץ הגיבוי');
      }
    };
    reader.readAsText(file);
  } catch (error) {
    console.error('Error restoring data:', error);
    alert('שגיאה בשחזור הנתונים');
  }
};



export { FirebaseService, app, database };