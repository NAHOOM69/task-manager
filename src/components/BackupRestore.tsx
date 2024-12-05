'use client';

import { saveAs } from 'file-saver';
import { firebaseService } from '@/lib/firebase';

export default function BackupRestore() {
  const handleBackup = async () => {
    try {
      const tasksSnapshot = await firebaseService.getAllTasks();
      const casesSnapshot = await firebaseService.getAllCases();

      const backupData = {
        tasks: tasksSnapshot || [],
        cases: casesSnapshot || [],
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      saveAs(blob, `backup-${new Date().toISOString()}.json`);

      alert('הגיבוי הושלם בהצלחה!');
    } catch (error) {
      console.error('Error backing up data:', error);
      alert('אירעה שגיאה בגיבוי הנתונים.');
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileText = await file.text();
      const { tasks, cases } = JSON.parse(fileText);

      if (tasks && Array.isArray(tasks)) {
        for (const task of tasks) {
          await firebaseService.saveTask(task);
        }
      }

      if (cases && Array.isArray(cases)) {
        for (const caseItem of cases) {
          await firebaseService.saveCase(caseItem);
        }
      }

      alert('השחזור הושלם בהצלחה!');
    } catch (error) {
      console.error('Error restoring data:', error);
      alert('אירעה שגיאה בשחזור הנתונים.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">ניהול גיבוי ושחזור</h1>

      <div className="flex gap-4">
        <button
          onClick={handleBackup}
          className="px-6 py-3 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
        >
          גיבוי נתונים
        </button>

        <label className="cursor-pointer px-6 py-3 bg-green-500 text-white font-bold rounded hover:bg-green-600">
          שחזור נתונים
          <input
            type="file"
            accept=".json"
            onChange={handleRestore}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
