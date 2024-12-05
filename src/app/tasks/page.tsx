'use client';

import { Loader2 } from 'lucide-react';
import TaskManager from '@/components/TaskManager';

export default function TasksPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">ניהול משימות</h1>
      
      {/* TaskManager component */}
      <TaskManager />
    </div>
  );
}
