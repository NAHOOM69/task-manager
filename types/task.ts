export interface Task {
    id: number;
    clientName: string;
    task: string;
    dueDate: string;
    reminderDate?: string;
    completed: boolean;
    notified?: boolean;
  }