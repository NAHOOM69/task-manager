
// Types/case.ts
export enum CaseType {
  REGULAR = 'regular',
  HEARING = 'hearing'
}

// types/case.ts
export interface Case {
  id: string;
  clientName: string;
  caseNumber: string;
  legalNumber: string;
  subject: string;
  court?: string;
  judge?: string;
  nextHearing?: string;
  status: 'active' | 'pending' | 'closed';
  clientPhone: string;
  clientEmail: string;
  createdAt: string;
  updatedAt: string;
}


export interface CaseInput extends Omit<Case, 'id' | 'completed' | 'notified'> {}