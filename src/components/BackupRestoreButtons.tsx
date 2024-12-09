// components/BackupRestoreButtons.tsx
import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { FirebaseService } from '@/lib/firebase';
import { Task } from '@/types/Task';

const BackupRestoreButtons = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    try {
      // קבלת כל הנתונים
      const tasks = await FirebaseService.getAllTasks();
      
      const backupData = {
        tasks: tasks.reduce<Record<string, Task>>((acc, task) => {
          acc[`-${task.id}`] = task;
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      };
  
      // יצירת קובץ JSON
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('שגיאה ביצירת גיבוי');
    }
  };
  
  const handleRestore = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (!data.tasks) {
            throw new Error('Invalid backup file structure');
          }
  
          await FirebaseService.restoreData(data);
          alert('שחזור הנתונים הושלם בהצלחה');
        } catch (error) {
          console.error('Error parsing backup file:', error);
          alert('שגיאה בקריאת קובץ הגיבוי');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error restoring data:', error);
      alert('שגיאה בשחזור הנתונים');
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={handleBackup}
        title="גיבוי נתונים"
      >
        <Download className="h-4 w-4" />
      </Button>
  
      <Button 
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        title="שחזור נתונים"
      >
        <Upload className="h-4 w-4" />
      </Button>
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={(e) => e.target.files?.[0] && handleRestore(e.target.files[0])}
      />
    </div>
  );
};

export default BackupRestoreButtons;