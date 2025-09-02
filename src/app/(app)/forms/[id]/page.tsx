'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import jsPDF from 'jspdf';
import { Accordion } from '@/components/ui/accordion';
import { Header } from '@/components/header';
import { MedicalFormSection } from '@/components/medical-form-section';
import { summarizeMedicalSection } from '@/ai/flows/summarize-medical-section';
import { useToast } from '@/hooks/use-toast';
import type { TranscribeMedicalInterviewOutput } from '@/ai/flows/transcribe-medical-interview';
import { MedicalForm } from '@/types/medical-form';
import { defaultTemplate, getInitialForm } from '@/lib/forms-utils';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

// Helper to format a string from a nested object for display
function formatContent(data: any, indent = ''): string {
    if (!data) return '';
    if (typeof data !== 'object') {
        return `${indent}${data}`;
    }
    return Object.entries(data)
        .map(([key, value]) => {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                return `${indent}${formattedKey}:\n${formatContent(value, `${indent}  `)}`;
            }
            if (value) {
                return `${indent}${formattedKey}: ${value}`;
            }
            return `${indent}${formattedKey}: `;

        })
        .join('\n');
}

export default function FormPage() {
  const [currentForm, setCurrentForm] = useState<MedicalForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;
  const { user } = useAuth();

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
    fetchForm();
  }, [fetchForm]);

  const saveForm = useCallback(async (formToSave: MedicalForm) => {
    if (!user || !formToSave) return;
    setIsSaving(true);
    try {
      const formRef = doc(db, 'users', user.uid, 'forms', formToSave.id);
      // Remove id from object to avoid saving it in the document fields
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


  const updateCurrentForm = (updatedForm: MedicalForm, shouldSave: boolean = false) => {
    setCurrentForm(updatedForm);
    if (shouldSave) {
        saveForm(updatedForm);
    }
  };

  const handleAllSectionsContentChange = (fullData: TranscribeMedicalInterviewOutput) => {
    if (!currentForm) return;
    const newSections = currentForm.sections.map(section => {
      const sectionData = fullData[section.id as keyof TranscribeMedicalInterviewOutput];
       if (sectionData) {
        const content = formatContent(sectionData);
        return { ...section, content };
      }
      return section;
    });
    const updatedForm = { ...currentForm, sections: newSections, updatedAt: new Date().toISOString() };
    updateCurrentForm(updatedForm, true); // Save after a full update
  };

  const handleSectionContentChange = (id: string, newContent: string) => {
    if (!currentForm) return;
    const newSections = currentForm.sections.map(section =>
      section.id === id ? { ...section, content: newContent } : section
    );
    updateCurrentForm({ ...currentForm, sections: newSections, updatedAt: new Date().toISOString() }, false); // Don't save on every keystroke
  };

  const handleResetSection = (id: string) => {
    if (!currentForm) return;
    
    // Find the original template to reset from
    const template = defaultTemplate; // Assuming a single default for now. Could be enhanced.
    const originalSection = template.sections.find(section => section.id === id);

    if (originalSection) {
        handleSectionContentChange(id, originalSection.content);
        toast({
            title: 'Sección Reiniciada',
            description: `El contenido de "${originalSection.title}" ha sido restaurado.`,
        });
    }
  };

  const handleSummarizeSection = async (id: string) => {
    if (!currentForm) return;
    const section = currentForm.sections.find(s => s.id === id);
    if (section && section.content) {
      setIsSummarizing(id);
      try {
        const result = await summarizeMedicalSection({ sectionText: section.content });
        handleSectionContentChange(id, result.summary);
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

  const handleSaveForm = () => {
    if (!currentForm) return;
    saveForm({ ...currentForm, updatedAt: new Date().toISOString() });
  };

  const handleExportDoc = () => {
    if (!currentForm) return;
    const header = `<h1 style="font-family: Arial, sans-serif; font-size: 24px; font-weight: bold;">${currentForm.name}</h1>`;
    const content = currentForm.sections.map(section => 
        `<h2 style="font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; margin-top: 20px;">${section.title}</h2><p style="font-family: Arial, sans-serif; font-size: 14px; white-space: pre-wrap;">${section.content}</p>`
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
                onBlur={() => handleSaveForm()} // Save when user clicks away
                className="text-3xl font-bold mb-6 text-center font-headline text-foreground"
            />
            <Accordion type="single" collapsible className="w-full space-y-4">
              {currentForm.sections.map((section) => (
                <MedicalFormSection
                  key={section.id}
                  section={section}
                  onContentChange={handleSectionContentChange}
                  onAllSectionsContentChange={handleAllSectionsContentChange}
                  onReset={handleResetSection}
                  onSummarize={handleSummarizeSection}
                  isSummarizing={isSummarizing === section.id}
                  onSave={handleSaveForm}
                  isSaving={isSaving}
                  isEditable={false}
                />
              ))}
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
}
