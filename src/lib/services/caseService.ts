// src/lib/services/caseService.ts
import { ref, get, set, remove, query, orderByChild } from 'firebase/database';
import { database } from '../firebase';

interface Case {
  id: string;
  clientName: string;
  caseNumber: string;
  legalNumber: string;
  subject: string;
  court: string;
  judge: string;
  nextHearing?: string;
  status: 'active' | 'pending' | 'closed';
  clientPhone: string;
  clientEmail: string;
  createdAt: string;
  updatedAt: string;
}

const CASES_REF = 'cases';

export const caseService = {
  async createCase(caseData: Case): Promise<Case> {
    const newCaseRef = ref(database, `${CASES_REF}/${caseData.id}`);
    await set(newCaseRef, {
      ...caseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return caseData;
  },

  async getCase(id: string): Promise<Case | null> {
    const caseRef = ref(database, `${CASES_REF}/${id}`);
    const snapshot = await get(caseRef);
    return snapshot.val();
  },

  async updateCase(id: string, caseData: Partial<Case>): Promise<void> {
    const caseRef = ref(database, `${CASES_REF}/${id}`);
    const currentCase = await this.getCase(id);
    if (currentCase) {
      await set(caseRef, {
        ...currentCase,
        ...caseData,
        updatedAt: new Date().toISOString()
      });
    }
  },

  async deleteCase(id: string): Promise<void> {
    const caseRef = ref(database, `${CASES_REF}/${id}`);
    await remove(caseRef);
  },

  async getAllCases(): Promise<Case[]> {
    const casesRef = ref(database, CASES_REF);
    const snapshot = await get(casesRef);
    return snapshot.val() ? Object.values(snapshot.val()) : [];
  },

  async getCasesByClient(clientName: string): Promise<Case[]> {
    const casesRef = ref(database, CASES_REF);
    const clientQuery = query(casesRef, orderByChild('clientName'));
    const snapshot = await get(clientQuery);
    
    const cases: Case[] = [];
    snapshot.forEach((childSnapshot) => {
      const caseData = childSnapshot.val();
      if (caseData.clientName.toLowerCase().includes(clientName.toLowerCase())) {
        cases.push(caseData);
      }
    });
    
    return cases;
  }
};