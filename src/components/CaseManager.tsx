import React, { useEffect, useState } from "react";
import { firebaseService } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2 } from "lucide-react";

interface CaseData {
  id: string;
  clientName: string;
  subject: string;
  status: string;
}

export default function CaseManager() {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCase, setNewCase] = useState({ clientName: "", subject: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

  // Fetch cases
  useEffect(() => {
    const unsubscribe = firebaseService.onCasesChange((cases) => {
      setCases(cases);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add a new case
  const handleAddCase = async () => {
    try {
      await firebaseService.saveCase(newCase);
      setNewCase({ clientName: "", subject: "" });
    } catch (error: any) {
      console.error("Error adding case:", error);
      setError("שגיאה בהוספת תיק חדש.");
    }
  };

  // Delete a case
  const handleDeleteCase = async (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק את התיק?")) {
      try {
        await firebaseService.deleteCase(id);
      } catch (error: any) {
        console.error("Error deleting case:", error);
        setError("שגיאה במחיקת התיק.");
      }
    }
  };

  // Edit a case
  const handleEditCase = (caseData: CaseData) => {
    setIsEditing(true);
    setEditingCaseId(caseData.id);
    setNewCase({ clientName: caseData.clientName, subject: caseData.subject });
  };

  // Update a case
  const handleUpdateCase = async () => {
    if (!editingCaseId) return;
    try {
      await firebaseService.updateCase(editingCaseId, newCase);
      setIsEditing(false);
      setEditingCaseId(null);
      setNewCase({ clientName: "", subject: "" });
    } catch (error: any) {
      console.error("Error updating case:", error);
      setError("שגיאה בעדכון התיק.");
    }
  };

  if (isLoading) {
    return <div>טוען תיקים...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ניהול תיקים</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="שם הלקוח"
          value={newCase.clientName}
          onChange={(e) =>
            setNewCase({ ...newCase, clientName: e.target.value })
          }
          className="border p-2 rounded w-full mb-2"
        />
        <input
          type="text"
          placeholder="נושא התיק"
          value={newCase.subject}
          onChange={(e) =>
            setNewCase({ ...newCase, subject: e.target.value })
          }
          className="border p-2 rounded w-full mb-4"
        />
        {isEditing ? (
          <Button onClick={handleUpdateCase} variant="default">
            עדכן תיק
          </Button>
        ) : (
          <Button onClick={handleAddCase} variant="default">
            הוסף תיק
          </Button>
        )}
      </div>

      <ul>
        {cases.map((caseData) => (
          <li key={caseData.id} className="mb-4 border p-4 rounded shadow">
            <div className="flex justify-between">
              <div>
                <h2 className="font-bold">{caseData.clientName}</h2>
                <p>{caseData.subject}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleEditCase(caseData)}
                  variant="outline"
                  size="sm"
                >
                  <Edit2 width={16} height={16} />
                </Button>
                <Button
                  onClick={() => handleDeleteCase(caseData.id)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 width={16} height={16} />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
