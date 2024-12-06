// Case status types
export type CaseStatus = 'active' | 'pending' | 'closed' | 'hold';

// Main Case interface
export interface Case {
  id: string;
  clientName: string;
  caseNumber: string;
  legalNumber: string;
  subject: string;
  court: string;
  judge: string;
  nextHearing: string;
  status: CaseStatus;
  clientPhone: string;
  clientEmail: string;
  notes: string;       // הוספנו
  createdAt: string;
  updatedAt: string;
}

// Interface for creating a new case (without id and timestamps)
export interface CaseInput extends Omit<Case, 'id' | 'createdAt' | 'updatedAt'> {}