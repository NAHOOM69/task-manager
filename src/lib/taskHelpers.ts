import { Task, TaskType } from '@/Types/Task';

export const cleanTaskForFirebase = (task: Partial<Task>): Task => {
  if (!task) {
    throw new Error('Task data is required');
  }

  // Helper for date validation and formatting
  const validateDateTime = (dateString: string | undefined): string => {
    if (!dateString) return new Date().toISOString();
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return new Date().toISOString();
      // Ensure the time component is included
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const cleanedTask: Task = {
    id: Date.now().toString(),
    clientName: task.clientName?.trim() || '',
    taskName: task.taskName?.trim() || '',
    dueDate: validateDateTime(task.dueDate),
    completed: Boolean(task.completed),
    notified: task.notified ?? false,
    type: task.type || TaskType.REGULAR,
    reminderDate: task.reminderDate ? validateDateTime(task.reminderDate) : '',
    court: task.court?.trim() || '',
    judge: task.judge?.trim() || '',
    courtDate: task.courtDate ? validateDateTime(task.courtDate) : ''
  };

  return cleanedTask;
};

export const validateTask = (task: Task): boolean => {
  const errors: string[] = [];

  if (!task.clientName?.trim()) {
    errors.push('שם לקוח הוא שדה חובה');
  }
  
  if (!task.taskName?.trim()) {
    errors.push('שם משימה הוא שדה חובה');
  }

  if (!task.dueDate && task.type !== TaskType.HEARING) {
    errors.push('תאריך יעד הוא שדה חובה');
  }

  if (task.type === TaskType.HEARING) {
    if (!task.court?.trim()) {
      errors.push('שם בית המשפט הוא שדה חובה עבור דיון משפטי');
    }
    if (!task.courtDate) {
      errors.push('תאריך דיון הוא שדה חובה עבור דיון משפטי');
    }
  }

  // Date validations
  if (task.dueDate && isNaN(new Date(task.dueDate).getTime())) {
    errors.push('תאריך יעד אינו תקין');
  }

  if (task.reminderDate) {
    const reminderDate = new Date(task.reminderDate);
    if (isNaN(reminderDate.getTime())) {
      errors.push('תאריך תזכורת אינו תקין');
    }
    if (task.dueDate && reminderDate > new Date(task.dueDate)) {
      errors.push('תאריך התזכורת חייב להיות לפני תאריך היעד');
    }
  }

  if (task.courtDate && isNaN(new Date(task.courtDate).getTime())) {
    errors.push('תאריך דיון אינו תקין');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return true;
};

export const getTaskDisplayDetails = (task: Task) => ({
  isOverdue: new Date(task.dueDate) < new Date() && !task.completed,
  isDueSoon: !task.completed && isDateDueSoon(task.dueDate),
  hasReminder: Boolean(task.reminderDate) && !task.notified,
  isHearing: task.type === TaskType.HEARING,
});

const isDateDueSoon = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const hours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hours > 0 && hours <= 24;
};