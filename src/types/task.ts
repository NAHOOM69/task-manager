export enum TaskType {
  REGULAR = 'regular',
  HEARING = 'hearing'
}

export interface Task {
  id: string;            // שינוי מ-number ל-string
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
}

export interface TaskInput extends Omit<Task, 'id' | 'completed' | 'notified'> {}