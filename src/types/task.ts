export enum TaskType {
  REGULAR = 'regular',
  HEARING = 'hearing'
}

export interface Task {
  id: string;
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
  caseId?: string;
  caseNumber?: string;   // חזרה לאופציונלי
  legalNumber?: string;  // חזרה לאופציונלי
}

export interface TaskInput extends Omit<Task, 'id' | 'completed' | 'notified' | '#hash'> {}