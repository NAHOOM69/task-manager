import React, { useState } from 'react';
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
import { AlertCircle } from 'lucide-react';

interface Task {
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
  type?: 'hearing' | 'regular';
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Partial<Task>) => Promise<void>;
  initialTask?: Task | null;
}

const FormInput: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}> = ({ label, type = "text", value, onChange, error, required }) => (
  <div className="space-y-2">
    <Label>
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
        <AlertCircle size={16} />
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
  const [formData, setFormData] = useState<Partial<Task>>({
    clientName: initialTask?.clientName || '',
    taskName: initialTask?.taskName || '',
    dueDate: initialTask?.dueDate ? initialTask.dueDate.split('T')[0] : '',
    reminderDate: initialTask?.reminderDate || '',
    type: initialTask?.type || 'regular',
    court: initialTask?.court || '',
    judge: initialTask?.judge || '',
    courtDate: initialTask?.courtDate || ''
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
    
    if (formData.type === 'hearing') {
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
          <DialogTitle>{initialTask ? 'עריכת משימה' : 'משימה חדשה'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          {/* Task Type Selection */}
          <div className="space-y-2">
            <Label>סוג משימה</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="regular"
                  checked={formData.type === 'regular'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'regular' | 'hearing' }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span>משימה רגילה</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="hearing"
                  checked={formData.type === 'hearing'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'regular' | 'hearing' }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span>דיון משפטי</span>
              </label>
            </div>
          </div>

          {/* Basic Fields */}
          <FormInput
            label="שם לקוח"
            value={formData.clientName || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, clientName: value }))}
            error={errors.clientName}
            required
          />

          <FormInput
            label="שם משימה"
            value={formData.taskName || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, taskName: value }))}
            error={errors.taskName}
            required
          />

          <FormInput
            label="תאריך יעד"
            type="date"
            value={formData.dueDate || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, dueDate: value }))}
            error={errors.dueDate}
            required
          />

          <FormInput
            label="תזכורת"
            type="datetime-local"
            value={formData.reminderDate || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, reminderDate: value }))}
          />

          {/* Court Details */}
          {formData.type === 'hearing' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-900">פרטי דיון</h3>
              
              <FormInput
                label="בית משפט"
                value={formData.court || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, court: value }))}
                error={errors.court}
                required
              />

              <FormInput
                label="שופט"
                value={formData.judge || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, judge: value }))}
              />

              <FormInput
                label="תאריך ושעת דיון"
                type="datetime-local"
                value={formData.courtDate || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, courtDate: value }))}
                error={errors.courtDate}
                required
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
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'שומר...' : initialTask ? 'עדכן משימה' : 'צור משימה'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormDialog;