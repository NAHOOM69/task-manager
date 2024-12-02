import { Task, TaskType } from '@/types/task';

export const cleanTaskForFirebase = (task: Partial<Task>): Task => {
  if (!task) {
    throw new Error('Task data is required');
  }

  const cleanedTask: Task = {
    id: task.id || Date.now(),
    clientName: task.clientName?.trim() || '',
    taskName: task.taskName?.trim() || '',
    dueDate: task.dueDate || new Date().toISOString(),
    completed: Boolean(task.completed),
    notified: task.notified ?? false,
    type: task.type || TaskType.REGULAR,
    reminderDate: task.reminderDate || '',
    court: task.court || '',
    judge: task.judge || '',
    courtDate: task.courtDate || ''
  };

  const validateDate = (dateString: string): string => {
    if (!dateString) return new Date().toISOString();
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return new Date().toISOString();
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  return {
    ...cleanedTask,
    dueDate: validateDate(cleanedTask.dueDate),
    reminderDate: cleanedTask.reminderDate,
    courtDate: cleanedTask.courtDate
  };
};

export const validateTask = (task: Task): boolean => {
  const errors: string[] = [];

  if (!task.clientName?.trim()) {
    errors.push('שם לקוח הוא שדה חובה');
  }
  
  if (!task.taskName?.trim()) {
    errors.push('שם משימה הוא שדה חובה');
  }

  if (!task.dueDate) {
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

  if (task.dueDate && isNaN(new Date(task.dueDate).getTime())) {
    errors.push('תאריך יעד אינו תקין');
  }

  if (task.reminderDate && isNaN(new Date(task.reminderDate).getTime())) {
    errors.push('תאריך תזכורת אינו תקין');
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