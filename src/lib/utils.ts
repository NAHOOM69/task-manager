import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export const formatDateForDevice = (dateString: string): string => {
  try {
    const date = new Date(dateString.replace(/-/g, '/'));
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return format(date, 'dd/MM/yyyy', { locale: he });
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

export const formatDateTimeForDevice = (dateString: string): string => {
  try {
    const date = new Date(dateString.replace(/-/g, '/'));
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return format(date, 'dd/MM/yyyy HH:mm', { locale: he });
  } catch (error) {
    console.error('Date/time formatting error:', error);
    return dateString;
  }
};