'use client';

import React, { useState } from 'react';

import {
  AlertCircle,
  CalendarCheck,
  Clock,
  User,
  Building2,
  ClipboardList,
  UserCircle2,
  Gavel,
  X,
  Save,
  ListTodo,
  FileSpreadsheet,
  Calendar,
  FileText,
  Hash
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Task, TaskInput, TaskType } from '@/Types/Task';
import type { Case } from '@/Types/Case';

interface TaskFormDialogProps {
  initialTask: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (taskData: TaskInput) => Promise<void>;
  cases: Case[];
}

const FormInput: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
}> = ({ label, type = "text", value, onChange, error, required, icon }) => (
  <div className="space-y-2">
    <Label className="flex items-center gap-2">
      {icon}
      {label}
      {required && <span className="text-red-500">*</span>}
    </Label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={error ? "border-red-500" : ""}
      dir="rtl"
    />
    {error && (
      <p className="text-sm text-red-500 flex items-center gap-1">
        <AlertCircle width={18} height={18} />
        {error}
      </p>
    )}
  </div>
);

const TaskFormDialog: React.FC<TaskFormDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialTask
}) => {
  const [formData, setFormData] = useState<TaskInput>({
    clientName: initialTask?.clientName || '',
    taskName: initialTask?.taskName || '',
    dueDate: initialTask?.dueDate ? initialTask.dueDate.split('T')[0] : '',
    reminderDate: initialTask?.reminderDate || '',
    type: initialTask?.type || TaskType.REGULAR,
    court: initialTask?.court || '',
    judge: initialTask?.judge || '',
    courtDate: initialTask?.courtDate || '',
    caseNumber: initialTask?.caseNumber || '',  // וידוא שזה קיים
    legalNumber: initialTask?.legalNumber || '' // וידוא שזה קיים
  });
  

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.clientName?.trim()) {
      newErrors.clientName = 'שם לקוח הוא שדה חובה';
    }
    
    if (!formData.taskName?.trim()) {
      newErrors.taskName = 'שם משימה הוא שדה חובה';
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'תאריך יעד הוא שדה חובה';
    }
    
   
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'אירעה שגיאה בשמירת המשימה. אנא נסה שוב.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">

      <DialogHeader>
        <DialogTitle>{initialTask ? 'עריכת משימה' : 'משימה חדשה'}</DialogTitle>
        <DialogDescription>
         {initialTask ? 'ערוך את פרטי המשימה' : 'הזן את פרטי המשימה. שדות עם * הם חובה'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
  <div>
    <Label htmlFor="clientName">שם לקוח *</Label>
    <Input
      id="clientName"
      value={formData.clientName}
      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
      required
    />
  </div>

  <div>
    <Label htmlFor="taskName">שם משימה *</Label>
    <Input
      id="taskName"
      value={formData.taskName}
      onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
      required
    />
  </div>

  <div>
    <Label htmlFor="dueDate">תאריך יעד *</Label>
    <Input
      id="dueDate"
      type="date"
      value={formData.dueDate}
      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
      required
    />
  </div>

  <div>
    <Label htmlFor="reminderDate">תזכורת</Label>
    <Input
      id="reminderDate"
      type="datetime-local"
      value={formData.reminderDate}
      onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
    />
  </div>

  <div className="mt-6 p-4 bg-sky-50 rounded-lg space-y-4">
    <div className="text-sky-900 font-medium">פרטי דיון משפטי (אופציונלי)</div>
    
    <div>
      <Label htmlFor="court" className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-sky-600" />
        בית משפט
      </Label>
      <Input
        id="court"
        value={formData.court}
        onChange={(e) => setFormData({ ...formData, court: e.target.value })}
      />
    </div>

    <div>
    <Label htmlFor="caseNumber">מספר תיק</Label>
    <Input
      id="caseNumber"
      value={formData.caseNumber}
      onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
    />
  </div>

  <div>
    <Label htmlFor="legalNumber">מספר ליגל</Label>
    <Input
      id="legalNumber"
      value={formData.legalNumber}
      onChange={(e) => setFormData({ ...formData, legalNumber: e.target.value })}
    />
  </div>

    <div>
      <Label htmlFor="judge" className="flex items-center gap-2">
        <Gavel className="w-4 h-4 text-sky-600" />
        שופט
      </Label>
      <Input
        id="judge"
        value={formData.judge}
        onChange={(e) => setFormData({ ...formData, judge: e.target.value })}
      />
    </div>

    <div>
      <Label htmlFor="courtDate" className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-sky-600" />
        תאריך ושעת דיון
      </Label>
      <Input
        id="courtDate"
        type="datetime-local"
        value={formData.courtDate}
        onChange={(e) => setFormData({ ...formData, courtDate: e.target.value })}
      />
    </div>
  </div>
      
          {errors.submit && (
            <Alert variant="destructive">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            <X className="ml-2" width={18} height={18} />
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
            <Save className="ml-2" width={18} height={18} />
            {isSubmitting ? 'טוען...' : initialTask ? 'עדכון משימה' : 'יצירת משימה'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormDialog;

