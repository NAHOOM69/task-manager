'use client';

import { Trash2, Edit2, Building2, User2, Calendar, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Case } from '@/Types/Case';

interface CaseCardProps {
  caseData: Case;
  onEdit: (caseId: string) => void;
  onDelete: (caseId: string) => void;
}

export default function CaseCard({ caseData, onEdit, onDelete }: CaseCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{caseData.clientName}</h3>
          <p className="text-sm text-gray-500">{caseData.caseNumber}</p>
          <p className="mt-2">{caseData.subject}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onEdit(caseData.id);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(caseData.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(caseData.court || caseData.judge || caseData.nextHearing) && (
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          {caseData.court && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {caseData.court}
            </div>
          )}
          {caseData.judge && (
            <div className="flex items-center gap-2">
              <User2 className="h-4 w-4" />
              {caseData.judge}
            </div>
          )}
          {caseData.nextHearing && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(caseData.nextHearing).toLocaleDateString('he-IL')}
            </div>
          )}
        </div>
      )}

      {caseData.notes && (
        <div className="mt-4 text-sm text-gray-600">
          {caseData.notes}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            caseData.status === "active"
              ? "bg-green-100 text-green-800"
              : caseData.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : caseData.status === "closed"
              ? "bg-gray-100 text-gray-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {caseData.status === "active"
            ? "פעיל"
            : caseData.status === "pending"
            ? "ממתין"
            : caseData.status === "closed"
            ? "סגור"
            : "מוקפא"}
        </span>

        {caseData.legalNumber && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <FolderOpen className="h-4 w-4" />
            {caseData.legalNumber}
          </span>
        )}
      </div>

      {(caseData.clientPhone || caseData.clientEmail) && (
        <div className="mt-4 text-xs text-gray-500">
          {caseData.clientPhone && (
            <div>טלפון: {caseData.clientPhone}</div>
          )}
          {caseData.clientEmail && (
            <div>דוא"ל: {caseData.clientEmail}</div>
          )}
        </div>
      )}
    </div>
  );
}