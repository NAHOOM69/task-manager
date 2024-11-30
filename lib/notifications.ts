import { getDatabase, ref, update } from 'firebase/database';

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

interface NotificationData {
  title: string;
  body: string;
  taskId: number;
  type?: string;
  options?: NotificationOptions;
}

interface NotificationOptions extends Record<string, unknown> {
  body: string;
  icon: string;
  badge: string;
  vibrate: number[];
  data: {
    taskId: number;
    url: string;
    type: string;
    timestamp: number;
  };
  actions: Array<{
    action: string;
    title: string;
  }>;
}

export class NotificationService {
  private static instance: NotificationService;
  private swRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        await this.requestPermission();
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  private createNotificationContent(task: Task): NotificationData {
    return {
      title: task.type === 'hearing' ? 'תזכורת דיון' : 'תזכורת משימה',
      body: this.createNotificationBody(task),
      taskId: task.id,
      type: task.type
    };
  }

  private createNotificationBody(task: Task): string {
    const parts = [
      `${task.taskName}`,
      `לקוח: ${task.clientName}`,
    ];

    if (task.type === 'hearing') {
      if (task.court) parts.push(`בית משפט: ${task.court}`);
      if (task.judge) parts.push(`שופט: ${task.judge}`);
      if (task.courtDate) {
        const date = new Date(task.courtDate);
        parts.push(`תאריך: ${date.toLocaleDateString('he-IL')}`);
        parts.push(`שעה: ${date.toLocaleTimeString('he-IL')}`);
      }
    }

    if (task.dueDate) {
      parts.push(`תאריך יעד: ${new Date(task.dueDate).toLocaleDateString('he-IL')}`);
    }

    return parts.join('\n');
  }

  private async showNotification(data: NotificationData): Promise<void> {
    if (!this.swRegistration) {
      throw new Error('Service Worker not registered');
    }

    const options: NotificationOptions = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-144x144.png',
      vibrate: [200, 100, 200],
      data: {
        taskId: data.taskId,
        url: '/',
        type: data.type || 'task',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'open',
          title: 'פתח משימה'
        },
        {
          action: 'snooze',
          title: 'דחה ב-5 דקות'
        },
        {
          action: 'dismiss',
          title: 'סגור'
        }
      ]
    };

    await this.swRegistration.showNotification(data.title, options);
  }

  async scheduleTaskReminder(task: Task): Promise<void> {
    if (!task.reminderDate) return;

    const reminderTime = new Date(task.reminderDate).getTime();
    const now = Date.now();
    const delay = Math.max(0, reminderTime - now);

    if (delay >= 0) {
      try {
        // Schedule notification
        await this.scheduleNotification(task, delay);
        
        // Update task in Firebase
        const db = getDatabase();
        await update(ref(db, `tasks/${task.id}`), {
          notified: delay === 0 // Mark as notified only if shown immediately
        });
      } catch (error) {
        console.error('Error scheduling task reminder:', error);
        throw error;
      }
    }
  }

  private async scheduleNotification(task: Task, delay: number): Promise<void> {
    const notificationData = this.createNotificationContent(task);
    
    if (delay > 0) {
      setTimeout(async () => {
        await this.showNotification(notificationData);
      }, delay);
    } else {
      await this.showNotification(notificationData);
    }
  }

  async cancelTaskReminder(taskId: number): Promise<void> {
    if (!this.swRegistration) return;

    const notifications = await this.swRegistration.getNotifications();
    notifications.forEach(notification => {
      if (notification.data?.taskId === taskId) {
        notification.close();
      }
    });
  }

  async sendImmediateNotification(task: Task): Promise<void> {
    if (!this.swRegistration) return;
    await this.scheduleNotification(task, 0);
  }
}