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
  FileSpreadsheet
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Task, TaskInput, TaskType } from '@/Types/Task';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (taskData: TaskInput) => Promise<void>;
  initialTask: Task | null;
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
    reminderDate: initialTask?.reminderDate,
    type: initialTask?.type || TaskType.REGULAR,
    court: initialTask?.court,
    judge: initialTask?.judge,
    courtDate: initialTask?.courtDate
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
    
    if (formData.type === TaskType.HEARING) {
      if (!formData.court?.trim()) {
        newErrors.court = 'בית משפט הוא שדה חובה עבור דיון';
      }
      if (!formData.courtDate) {
        newErrors.courtDate = 'תאריך דיון הוא שדה חובה';
      }
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
          <DialogTitle className="flex items-center gap-2">
            {initialTask ? <FileSpreadsheet width={18} height={18} /> : <ListTodo width={18} height={18} />}
            {initialTask ? 'עריכת משימה' : 'משימה חדשה'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
            <ClipboardList width={18} height={18} />
              סוג משימה
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value={TaskType.REGULAR}
                  checked={formData.type === TaskType.REGULAR}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as TaskType }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span>משימה רגילה</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value={TaskType.HEARING}
                  checked={formData.type === TaskType.HEARING}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as TaskType }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span>דיון משפטי</span>
              </label>
            </div>
          </div>

          <FormInput
            label="שם לקוח"
            value={formData.clientName}
            onChange={(value) => setFormData(prev => ({ ...prev, clientName: value }))}
            error={errors.clientName}
            required
            icon={<UserCircle2 width={18} height={18} />}
          />

          <FormInput
            label="שם משימה"
            value={formData.taskName}
            onChange={(value) => setFormData(prev => ({ ...prev, taskName: value }))}
            error={errors.taskName}
            required
            icon={<ClipboardList width={18} height={18} />}
          />

          <FormInput
            label="תאריך יעד"
            type="date"
            value={formData.dueDate}
            onChange={(value) => setFormData(prev => ({ ...prev, dueDate: value }))}
            error={errors.dueDate}
            required
            icon={<CalendarCheck width={18} height={18} />}
          />

          <FormInput
            label="תזכורת"
            type="datetime-local"
            value={formData.reminderDate || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, reminderDate: value }))}
            icon={<Clock width={18} height={18} />}
          />

          {formData.type === TaskType.HEARING && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Gavel width={18} height={18} />
                פרטי דיון
              </h3>
              
              <FormInput
                label="בית משפט"
                value={formData.court || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, court: value }))}
                error={errors.court}
                required
                icon={<Building2 width={18} height={18} />}
              />

              <FormInput
                label="שופט"
                value={formData.judge || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, judge: value }))}
                icon={<User width={18} height={18} />}
              />

              <FormInput
                label="תאריך ושעת דיון"
                type="datetime-local"
                value={formData.courtDate || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, courtDate: value }))}
                error={errors.courtDate}
                required
                icon={<CalendarCheck width={18} height={18} />}
              />
            </div>
          )}

          {errors.submit && (
            <Alert variant="destructive">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            <X width={18} height={18} /> className="ml-2" 
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
            <Save width={18} height={18} /> className="ml-2" 
              {isSubmitting ? 'שומר...' : initialTask ? 'עדכן משימה' : 'צור משימה'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormDialog;