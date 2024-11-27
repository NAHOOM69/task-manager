'use client';

import TaskManager from '@/components/TaskManager';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">מנהל משימות</h1>
        <TaskManager />
      </div>
    </main>
  );
}