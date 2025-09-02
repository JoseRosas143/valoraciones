export interface MedicalSection {
  id: string;
  title: string;
  content: string;
}

export interface MedicalForm {
  id: string;
  name: string;
  sections: MedicalSection[];
  isTemplate?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // This field will only exist on the frontend after being fetched
  // and should not be written to Firestore.
  userId?: string; 
}
