import { getDatabase, ref, update } from 'firebase/database';
import { Task } from '@/types/task';

export class NotificationService {
  private static instance: NotificationService;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    if ('serviceWorker' in navigator && 'Notification' in window) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered');
        this.initialized = true;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    } else {
      console.warn('Push notifications are not supported');
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  async scheduleTaskReminder(task: Task): Promise<void> {
    if (!task.reminderDate || !this.initialized) return;

    try {
      const reminderTime = new Date(task.reminderDate).getTime();
      const now = Date.now();
      const delay = Math.max(0, reminderTime - now);

      if (delay > 0) {
        setTimeout(() => this.showNotification(task), delay);
      } else {
        await this.showNotification(task);
      }

      const db = getDatabase();
      await update(ref(db, `tasks/${task.id}`), { notified: true });
    } catch (error) {
      console.error('Reminder scheduling error:', error);
    }
  }

  private async showNotification(task: Task): Promise<void> {
    if (!this.initialized || !this.swRegistration) return;

    const title = task.type === 'hearing' ? 'תזכורת דיון' : 'תזכורת משימה';
    const body = this.createNotificationBody(task);

    try {
      await this.swRegistration.showNotification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-144x144.png',
        vibrate: [200, 100, 200],
        tag: `task-${task.id}`,
        data: {
          taskId: task.id,
          type: task.type,
          timestamp: Date.now()
        },
        actions: [
          { action: 'open', title: 'פתח משימה' },
          { action: 'dismiss', title: 'סגור' }
        ]
      });
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  private createNotificationBody(task: Task): string {
    const parts = [
      task.taskName,
      `לקוח: ${task.clientName}`
    ];

    if (task.type === 'hearing') {
      if (task.court) parts.push(`בית משפט: ${task.court}`);
      if (task.judge) parts.push(`שופט: ${task.judge}`);
      if (task.courtDate) {
        const date = new Date(task.courtDate);
        parts.push(
          `מועד: ${date.toLocaleDateString('he-IL')} ${date.toLocaleTimeString('he-IL')}`
        );
      }
    }

    if (task.dueDate) {
      parts.push(`תאריך יעד: ${new Date(task.dueDate).toLocaleDateString('he-IL')}`);
    }

    return parts.join('\n');
  }

  async sendImmediateNotification(task: Task): Promise<void> {
    if (!this.initialized) return;
    await this.showNotification(task);
  }

  async cancelTaskReminder(taskId: number): Promise<void> {
    if (!this.swRegistration) return;
    
    const notifications = await this.swRegistration.getNotifications();
    notifications
      .filter(notification => notification.data?.taskId === taskId)
      .forEach(notification => notification.close());
  }
}