export interface MedicalSection {
  id: string;
  title: string;
  content: string;
  summary?: string; // To store the AI-generated summary
  aiPrompt?: string; // To store custom instructions for the AI for this section
}

export interface MedicalForm {
  id: string;
  name: string;
  sections: MedicalSection[];
  isTemplate?: boolean;
  createdAt?: string;
  updatedAt?: string;
  templateId?: string;
  generalAiPrompt?: string; // A general instruction for the AI for the entire form
  // This field will only exist on the frontend after being fetched
  // and should not be written to Firestore.
  userId?: string; 
}
