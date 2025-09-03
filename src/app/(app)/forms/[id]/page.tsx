
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import jsPDF from 'jspdf';
import { Accordion } from '@/components/ui/accordion';
import { Header } from '@/components/header';
import { MedicalFormSection } from '@/components/medical-form-section';
import { summarizeMedicalSection } from '@/ai/flows/summarize-medical-section';
import { suggestDiagnosis } from '@/ai/flows/suggest-diagnosis';
import { useToast } from '@/hooks/use-toast';
import type { TranscribeMedicalInterviewOutput } from '@/ai/flows/transcribe-medical-interview';
import { MedicalForm, MedicalSection } from '@/types/medical-form';
import { defaultTemplates, noteTemplate } from '@/lib/forms-utils';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

// Helper to format a string from a nested object for display
function formatContent(data: any): string {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null) {
      // Specific handler for 'consulta' which just has a 'transcripcion' field
      if ('transcripcion' in data && Object.keys(data).length === 1) {
        return data.transcripcion || '';
      }
      // General object formatter
      return Object.entries(data)
        .map(([key, value]) => {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const nestedContent = formatContent(value).split('\n').map(line => `  ${line}`).join('\n');
            return `${formattedKey}:\n${nestedContent}`;
          }
          if (value !== undefined && value !== null && value !== '') {
            return `${formattedKey}: ${value}`;
          }
          return null; // Filter out empty/null/undefined values
        })
        .filter(Boolean)
        .join('\n');
    }
    return String(data);
}


export default function FormPage() {
  const [currentForm, setCurrentForm] = useState<MedicalForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState<string | null>(null);
  const [fullTranscription, setFullTranscription] = useState('');
  
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;
  const { user } = useAuth();
  
  const isNoteTemplate = currentForm?.templateId === noteTemplate.id;

  const fetchForm = useCallback(async () => {
    if (!user || !formId) return;
    setIsLoading(true);
    try {
        const formRef = doc(db, 'users', user.uid, 'forms', formId);
        const docSnap = await getDoc(formRef);

        if (docSnap.exists()) {
            setCurrentForm({ id: docSnap.id, ...docSnap.data() } as MedicalForm);
        } else {
            toast({
                variant: 'destructive',
                title: 'Formulario no encontrado',
            });
            router.push('/forms');
        }
    } catch (error) {
        console.error("Error fetching form: ", error);
        toast({
            variant: 'destructive',
            title: 'Error al cargar',
            description: 'No se pudo cargar el formulario.',
        });
        router.push('/forms');
    } finally {
        setIsLoading(false);
    }
  }, [user, formId, router, toast]);

  useEffect(() => {
    if (user && formId) {
      fetchForm();
    }
  }, [user, formId, fetchForm]);

  const saveForm = useCallback(async (formToSave: MedicalForm | null) => {
    if (!user || !formToSave) return;
    setIsSaving(true);
    try {
      const formRef = doc(db, 'users', user.uid, 'forms', formToSave.id);
      const { id, ...formData } = formToSave;
      await setDoc(formRef, formData, { merge: true });
       toast({
            title: 'Formulario Guardado',
            description: 'Los cambios han sido guardados en la nube.',
        });
    } catch (error) {
        console.error("Error saving form: ", error);
         toast({
            variant: 'destructive',
            title: 'Error al Guardar',
            description: 'No se pudieron guardar los cambios.',
        });
    } finally {
        setIsSaving(false);
    }
  }, [user, toast]);


  const updateAndSaveForm = (updatedForm: MedicalForm) => {
    setCurrentForm(updatedForm);
    saveForm(updatedForm);
  };
  
  const handleAllSectionsContentChange = (fullData: TranscribeMedicalInterviewOutput) => {
    if (!currentForm) return;

    if (fullData.originalTranscription) {
      setFullTranscription(fullData.originalTranscription);
    }
    
    // Create a mutable copy of the form to update
    const updatedForm = { ...currentForm };
    let hasChanged = false;

    // Iterate over the keys in the data returned from the AI
    for (const key in fullData) {
        if (key === 'originalTranscription') continue;

        const sectionIndex = updatedForm.sections.findIndex(section => section.id === key);

        if (sectionIndex !== -1) {
            const sectionData = fullData[key as keyof TranscribeMedicalInterviewOutput];
            const newContent = formatContent(sectionData);

            if (newContent && updatedForm.sections[sectionIndex].content !== newContent) {
                updatedForm.sections[sectionIndex] = { ...updatedForm.sections[sectionIndex], content: newContent };
                hasChanged = true;
            }
        }
    }

    if (hasChanged) {
        updateAndSaveForm({ ...updatedForm, updatedAt: new Date().toISOString() });
    }
  };


  const handleSectionContentChange = (id: string, newContent: string) => {
    if (!currentForm) return;
    const newSections = currentForm.sections.map(section =>
      section.id === id ? { ...section, content: newContent } : section
    );
    // Don't save on every keystroke, only update state
    setCurrentForm({ ...currentForm, sections: newSections });
  };
  
  const handleSectionSummaryChange = (id: string, newSummary: string) => {
    if (!currentForm) return;
    const newSections = currentForm.sections.map(section =>
      section.id === id ? { ...section, summary: newSummary } : section
    );
    updateAndSaveForm({ ...currentForm, sections: newSections });
  };

  const handleResetSection = (id: string) => {
    if (!currentForm || !currentForm.templateId) return;
    
    // Check both default templates
    const allTemplates = [defaultTemplates, noteTemplate];
    const baseTemplate = allTemplates.find(t => t.id === currentForm?.templateId);

    if (baseTemplate) {
        const originalSection = baseTemplate.sections.find(section => section.id === id);
        if (originalSection) {
            const newSections = currentForm.sections.map(section =>
                section.id === id ? { ...section, content: originalSection.content || '', summary: '' } : section
            );
            updateAndSaveForm({ ...currentForm, sections: newSections });
            toast({
                title: 'Sección Reiniciada',
                description: `El contenido de "${originalSection.title}" ha sido restaurado.`,
            });
        }
    }
};

  const handleSummarizeSection = async (id: string) => {
    if (!currentForm) return;
    const section = currentForm.sections.find(s => s.id === id);
    if (section && section.content) {
      setIsSummarizing(id);
      try {
        const result = await summarizeMedicalSection({ sectionText: section.content });
        handleSectionSummaryChange(id, result.summary);
      } catch (error) {
        console.error('Summarization failed:', error);
        toast({
          variant: 'destructive',
          title: 'Error al Resumir',
          description: 'No se pudo resumir el contenido. Por favor, inténtelo de nuevo.',
        });
      } finally {
        setIsSummarizing(null);
      }
    }
  };
  
  const handleSuggestDiagnosis = async (id: string) => {
    if (!currentForm) return;
    const section = currentForm.sections.find(s => s.id === id);
    if (section && section.content) {
      setIsDiagnosing(id);
      try {
        const result = await suggestDiagnosis({ consultationText: section.content });
        const newSummary = `--- Posible Diagnóstico (IA) ---\n${result.diagnosis}`;
        handleSectionSummaryChange(id, newSummary);
      } catch (error) {
        console.error('Diagnosis suggestion failed:', error);
        toast({
          variant: 'destructive',
          title: 'Error al Sugerir Diagnóstico',
          description: 'No se pudo generar una sugerencia. Por favor, inténtelo de nuevo.',
        });
      } finally {
        setIsDiagnosing(null);
      }
    }
  };

  const handleSaveForm = () => {
    if (!currentForm) return;
    saveForm({ ...currentForm, updatedAt: new Date().toISOString() });
  };

  const handleExportDoc = () => {
    if (!currentForm) return;
    const header = `<h1 style="font-family: Arial, sans-serif; font-size: 24px; font-weight: bold;">${currentForm.name}</h1>`;
    const content = currentForm.sections.map(section => 
        `<h2 style="font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; margin-top: 20px;">${section.title}</h2><p style="font-family: Arial, sans-serif; font-size: 14px; white-space: pre-wrap;">${section.content}</p>${section.summary ? `<div style="background-color: #f0f0f0; border-left: 4px solid #ccc; padding: 10px; margin-top: 10px; white-space: pre-wrap;">${section.summary}</div>` : ''}`
    ).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family: Arial, sans-serif;">${header}${content}</body></html>`;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentForm.name.replace(/\s/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!currentForm) return;
    setIsLoadingPdf(true);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(currentForm.name, pageWidth / 2, y, { align: 'center' });
    y += 10;

    for (const section of currentForm.sections) {
        if (y > pageHeight - margin - 10) { // check for space for title
            pdf.addPage();
            y = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const titleLines = pdf.splitTextToSize(section.title, pageWidth - margin * 2);
        if (y + (titleLines.length * 7) > pageHeight - margin) {
            pdf.addPage();
            y = margin;
        }
        pdf.text(titleLines, margin, y);
        y += (titleLines.length * 7);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const contentLines = pdf.splitTextToSize(section.content, pageWidth - margin * 2);
        
        for (const line of contentLines) {
            if (y > pageHeight - margin) {
                pdf.addPage();
                y = margin;
            }
            pdf.text(line, margin, y);
            y += 5;
        }

        if(section.summary) {
            y += 5;
            pdf.setFillColor(240, 240, 240);
            const summaryLines = pdf.splitTextToSize(section.summary, pageWidth - margin * 2 - 4);
            const summaryHeight = summaryLines.length * 5 + 4;
            if (y + summaryHeight > pageHeight - margin) {
                pdf.addPage();
                y = margin;
            }
            pdf.rect(margin, y - 2, pageWidth - margin * 2, summaryHeight, 'F');
            pdf.text(summaryLines, margin + 2, y + 2);
            y += summaryHeight;

        }
        y += 5; // Extra space between sections
    }

    pdf.save(`${currentForm.name.replace(/\s/g, '_')}.pdf`);
    setIsLoadingPdf(false);
  };
  
  if (isLoading || !currentForm) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header 
        onExportDoc={handleExportDoc} 
        onExportPdf={handleExportPdf}
        isExportingPdf={isLoadingPdf}
      />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-background rounded-lg p-2 md:p-4">
            <Input 
                value={currentForm.name}
                onChange={(e) => setCurrentForm({ ...currentForm, name: e.target.value })}
                onBlur={handleSaveForm}
                className="text-3xl font-bold mb-6 text-center font-headline text-foreground"
            />
            <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={currentForm.sections[0]?.id}>
              {currentForm.sections.map((section) => (
                <MedicalFormSection
                  key={section.id}
                  section={section}
                  allSections={currentForm.sections}
                  generalAiPrompt={currentForm.generalAiPrompt}
                  onContentChange={handleSectionContentChange}
                  onAllSectionsContentChange={handleAllSectionsContentChange}
                  onReset={handleResetSection}
                  onSummarize={handleSummarizeSection}
                  onSuggestDiagnosis={handleSuggestDiagnosis}
                  isSummarizing={isSummarizing === section.id}
                  isDiagnosing={isDiagnosing === section.id}
                  onSave={handleSaveForm}
                  isSaving={isSaving}
                  isEditable={false}
                  isNote={isNoteTemplate}
                  fullTranscription={fullTranscription}
                />
              ))}
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
}

    