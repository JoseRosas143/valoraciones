'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import { Accordion } from '@/components/ui/accordion';
import { Header } from '@/components/header';
import { MedicalFormSection } from '@/components/medical-form-section';
import { summarizeMedicalSection } from '@/ai/flows/summarize-medical-section';
import { useToast } from '@/hooks/use-toast';
import type { TranscribeMedicalInterviewOutput } from '@/ai/flows/transcribe-medical-interview';
import { MedicalForm, MedicalSection } from '@/types/medical-form';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { defaultTemplate } from '@/lib/forms-utils';
import { Input } from '@/components/ui/input';

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

export default function FormPage({ params }: { params: { id: string } }) {
  const [forms, setForms] = useLocalStorage<MedicalForm[]>('medicalForms', [defaultTemplate]);
  const [currentForm, setCurrentForm] = useState<MedicalForm | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const form = forms.find(f => f.id === params.id);
    if (form) {
      setCurrentForm(form);
    } else {
      // If form is not found, redirect to the forms list
      router.push('/forms');
    }
  }, [params.id, forms, router]);

  const updateCurrentForm = (updatedForm: MedicalForm) => {
    setCurrentForm(updatedForm);
    const newForms = forms.map(f => (f.id === updatedForm.id ? updatedForm : f));
    setForms(newForms);
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
    updateCurrentForm({ ...currentForm, sections: newSections });
  };

  const handleSectionContentChange = (id: string, newContent: string) => {
    if (!currentForm) return;
    const newSections = currentForm.sections.map(section =>
      section.id === id ? { ...section, content: newContent } : section
    );
    updateCurrentForm({ ...currentForm, sections: newSections, updatedAt: new Date().toISOString() });
  };

  const handleResetSection = (id: string) => {
    if (!currentForm) return;
    const originalSection = defaultTemplate.sections.find(section => section.id === id);
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
    updateCurrentForm({ ...currentForm, updatedAt: new Date().toISOString() });
    toast({
      title: 'Formulario Guardado',
      description: 'El estado actual del formulario ha sido guardado.',
    });
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
  
  if (!currentForm) {
    return <div>Cargando formulario...</div>;
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
                onChange={(e) => updateCurrentForm({ ...currentForm, name: e.target.value })}
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
