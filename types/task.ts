export type TaskType = 'hearing' | 'regular';

export interface Task {
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
  type: TaskType;
}

export type TaskInput = Omit<Task, 'id' | 'completed' | 'notified'>;