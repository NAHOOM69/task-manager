'use client';

import { Briefcase, ListTodo, Clock, CalendarCheck2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FirebaseService } from '@/lib/firebase';
import type { Task } from '@/Types/Task';
import type { Case } from '@/Types/Case';
import { TaskType } from '@/Types/Task';
import BackupRestore from '@/components/BackupRestoreButtons';

export default function HomePage() {
  const [stats, setStats] = useState({
    activeTasks: 0,
    upcomingHearings: 0,
    activeCases: 0,
    completedTasks: 0
  });

  useEffect(() => {
    const unsubscribeTasks = FirebaseService.onTasksChange((tasksRecord: Record<string, Task>) => {
      const tasks = Object.values(tasksRecord);
      const now = new Date();
      const upcomingHearings = tasks.filter(task => 
        task.type === TaskType.HEARING && 
        !task.completed && 
        new Date(task.dueDate) > now
      ).length;
  
      setStats(prev => ({
        ...prev,
        activeTasks: tasks.filter(t => !t.completed).length,
        upcomingHearings,
        completedTasks: tasks.filter(t => t.completed).length
      }));
    });
  
    const unsubscribeCases = FirebaseService.onCasesChange((casesRecord: Record<string, Case>) => {
      const cases = Object.values(casesRecord);
      setStats(prev => ({
        ...prev,
        activeCases: cases.filter(c => c.status === 'active').length
      }));
    });
  
    return () => {
      unsubscribeTasks();
      unsubscribeCases();
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">ברוך הבא למערכת ניהול משפטי</h1>

      {/* רכיב גיבוי ושחזור */}
      <BackupRestore />

      <div className="max-w-4xl mx-auto mt-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <ListTodo className="h-5 w-5"/>
              <h3 className="font-medium">משימות פעילות</h3>
            </div>
            <p className="text-2xl font-bold">{stats.activeTasks}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-purple-500 mb-2">
              <Clock className="h-5 w-5" />
              <h3 className="font-medium">דיונים קרובים</h3>
            </div>
            <p className="text-2xl font-bold">{stats.upcomingHearings}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <Briefcase className="h-5 w-5" />
              <h3 className="font-medium">תיקים פעילים</h3>
            </div>
            <p className="text-2xl font-bold">{stats.activeCases}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <CalendarCheck2 className="h-5 w-5" />
              <h3 className="font-medium">משימות שהושלמו</h3>
            </div>
            <p className="text-2xl font-bold">{stats.completedTasks}</p>
          </div>
        </div>
        
        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/tasks" 
            className="group block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent hover:border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-500 group-hover:bg-blue-100 transition-colors">
                <ListTodo className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold">משימות</h2>
            </div>
            <p className="text-gray-600 group-hover:text-gray-900 transition-colors">
              ניהול משימות, דיונים ומעקב אחר לוחות זמנים
            </p>
          </Link>

          <Link href="/cases" 
            className="group block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent hover:border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-500 group-hover:bg-blue-100 transition-colors">
                <Briefcase className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold">תיקים</h2>
            </div>
            <p className="text-gray-600 group-hover:text-gray-900 transition-colors">
              ניהול תיקים, מעקב אחר סטטוס והתקדמות
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}