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
}
