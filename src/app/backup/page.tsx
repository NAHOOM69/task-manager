'use client';

import BackupRestore from '@/components/BackupRestoreButtons';

export default function BackupPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">ניהול גיבוי ושחזור</h1>
      <BackupRestore />
    </div>
  );
}
