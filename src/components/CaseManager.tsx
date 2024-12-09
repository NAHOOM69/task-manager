// חלק 1: Imports
'use client';

import React, { useState, useEffect } from 'react';
import { FirebaseService } from '@/lib/firebase';
import type { Case, CaseStatus } from '@/Types/Case';
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Building2,
  User,
  Loader2,
  X,
  Calendar,
  FolderOpen,
  Upload
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Task } from '@/Types/Task';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

// חלק 2: Interface Definitions
interface CaseFormProps {
  caseData: Case | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Case) => Promise<void>;
}

// הוספת ממשק עזר לשמירה על טיפוסים נכונים בטופס
interface CaseFormData extends Partial<Case> {
  status: CaseStatus;
  clientName: string;
  createdAt: string;
  updatedAt: string;
}

// חלק 3-4: CaseForm Component
const CaseForm: React.FC<CaseFormProps> = ({
  caseData,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CaseFormData>({
    clientName: caseData?.clientName || '',
    caseNumber: caseData?.caseNumber || '',
    legalNumber: caseData?.legalNumber || '',
    subject: caseData?.subject || '',
    court: caseData?.court || '',
    judge: caseData?.judge || '',
    nextHearing: caseData?.nextHearing || '',
    status: caseData?.status || 'active',
    clientPhone: caseData?.clientPhone || '',
    clientEmail: caseData?.clientEmail || '',
    notes: caseData?.notes || '',
    createdAt: caseData?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName) {
      alert('נא למלא שם לקוח');
      return;
    }

    const caseToSave: Case = {
      id: typeof caseData?.id === 'string' ? caseData.id : new Date().toISOString(),
      clientName: formData.clientName,
      caseNumber: formData.caseNumber || '',
      legalNumber: formData.legalNumber || '',
      subject: formData.subject || '',
      court: formData.court || '',
      judge: formData.judge || '',
      nextHearing: formData.nextHearing || '',
      status: formData.status,
      clientPhone: formData.clientPhone || '',
      clientEmail: formData.clientEmail || '',
      notes: formData.notes || '',
      createdAt: caseData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await onSubmit(caseToSave);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{caseData ? 'עריכת תיק' : 'תיק חדש'}</DialogTitle>
          <DialogDescription>
            {caseData
              ? 'ערוך את פרטי התיק'
              : 'הזן את פרטי התיק החדש. שדות עם * הם שדות חובה'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div>
            <Label htmlFor="clientName">שם לקוח *</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) =>
                setFormData({ ...formData, clientName: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="caseNumber">מספר תיק</Label>
              <Input
                id="caseNumber"
                value={formData.caseNumber}
                onChange={(e) =>
                  setFormData({ ...formData, caseNumber: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="legalNumber">מספר ליגל</Label>
              <Input
                id="legalNumber"
                value={formData.legalNumber}
                onChange={(e) =>
                  setFormData({ ...formData, legalNumber: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="subject">נושא התיק</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="status">סטטוס</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as CaseStatus })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">פעיל</SelectItem>
                <SelectItem value="pending">ממתין</SelectItem>
                <SelectItem value="closed">סגור</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="court">בית משפט</Label>
              <Input
                id="court"
                value={formData.court}
                onChange={(e) =>
                  setFormData({ ...formData, court: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="judge">שופט</Label>
              <Input
                id="judge"
                value={formData.judge}
                onChange={(e) =>
                  setFormData({ ...formData, judge: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="nextHearing">דיון הבא</Label>
            <Input
              id="nextHearing"
              type="datetime-local"
              value={formData.nextHearing}
              onChange={(e) =>
                setFormData({ ...formData, nextHearing: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientPhone">טלפון</Label>
              <Input
                id="clientPhone"
                type="tel"
                value={formData.clientPhone}
                onChange={(e) =>
                  setFormData({ ...formData, clientPhone: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">דוא"ל</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) =>
                  setFormData({ ...formData, clientEmail: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit">
              {caseData ? 'עדכן תיק' : 'צור תיק'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// חלק 5-6: Main Component and State Setup
export default function CaseManager() {
  const [cases, setCases] = useState<Case[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Main useEffect for data fetching
  useEffect(() => {
    console.log('Setting up case listener...');
    setIsLoading(true);

    try {
      const unsubscribeCases = FirebaseService.onCasesChange((updatedCases: Record<string, Case>) => {
        console.log('Received cases update:', Object.keys(updatedCases).length);
        setCases(Object.values(updatedCases));
        setIsLoading(false);
      });

      return () => {
        console.log('Cleaning up case listener...');
        unsubscribeCases();
      };
    } catch (error: any) {
      console.error('Error in cases listener:', error);
      setError('אירעה שגיאה בטעינת התיקים.');
      setIsLoading(false);
    }
  }, []);

  // Event Handlers
  const handleSubmit = async (caseData: Case) => {
    try {
      setIsLoading(true);
      if (selectedCase) {
        await FirebaseService.updateCase(selectedCase.id, caseData);
      } else {
        await FirebaseService.saveCase(caseData);
      }
      setIsFormOpen(false);
      setSelectedCase(null);
    } catch (error: any) {
      setError(`אירעה שגיאה בשמירת התיק: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את התיק?')) return;
    
    try {
      setIsLoading(true);
      console.log('Deleting case:', id);
      
      const caseToDelete = cases.find(c => c.id === id);
      if (!caseToDelete) {
        throw new Error('התיק לא נמצא');
      }

      await FirebaseService.deleteCase(id);
      console.log('Case deleted successfully');
      
      setCases(prevCases => prevCases.filter(c => c.id !== id));
    } catch (error: any) {
      console.error('Delete error:', error);
      setError(`אירעה שגיאה במחיקת התיק: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCSVImport = async (file: File) => {
    try {
      setIsLoading(true);
      const text = await file.text();
      await FirebaseService.importCasesFromCSV(text);
      setError(null);
    } catch (error: any) {
      setError(`שגיאה בייבוא הקובץ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter cases based on search query
  const filteredCases = cases.filter(case_ => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      case_?.clientName?.toLowerCase()?.includes(searchLower) ||
      case_?.caseNumber?.toLowerCase()?.includes(searchLower) ||
      case_?.subject?.toLowerCase()?.includes(searchLower) ||
      case_?.court?.toLowerCase()?.includes(searchLower) ||
      case_?.judge?.toLowerCase()?.includes(searchLower)
    );
  });

  // חלק 7-8: Component Render - Main Structure and Header
  return (
    <div className="container mx-auto p-4">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ניהול תיקים</h1>
        <div className="flex gap-4">
          <Input
            placeholder="חיפוש תיקים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={() => {
            setSelectedCase(null);
            setIsFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> תיק חדש
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  await handleCSVImport(file);
                }
              };
              input.click();
            }}
          >
            <Upload className="mr-2 h-4 w-4" /> ייבא תיקים מ-CSV
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => setError(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredCases.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCases.map((case_, index) => (
              <div
                key={case_.id || `case-${index}`}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                {/* Case Card Content - המשך בחלק הבא */}

                {/* Case Card Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{case_.clientName}</h3>
                    <p className="text-sm text-gray-500">{case_.caseNumber}</p>
                    <p className="mt-2">{case_.subject}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCase(case_);
                        setIsFormOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(case_.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Case Details Section */}
                {(case_.court || case_.judge || case_.nextHearing) && (
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    {case_.court && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {case_.court}
                      </div>
                    )}
                    {case_.judge && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {case_.judge}
                      </div>
                    )}
                    {case_.nextHearing && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(case_.nextHearing).toLocaleDateString('he-IL')}
                      </div>
                    )}
                  </div>
                )}

                {/* Case Footer */}
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      case_.status === "active"
                        ? "bg-green-100 text-green-800"
                        : case_.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {case_.status === "active"
                      ? "פעיל"
                      : case_.status === "pending"
                      ? "ממתין"
                      : "סגור"}
                  </span>
                  {case_.legalNumber && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <FolderOpen className="h-4 w-4" />
                      {case_.legalNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            {searchQuery
              ? "לא נמצאו תיקים התואמים את החיפוש"
              : "אין תיקים להצגה"}
          </p>
        )}
      </div>

      {/* Case Form Dialog */}
      {isFormOpen && (
        <CaseForm
          caseData={selectedCase}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedCase(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}