'use client';

import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Accordion } from '@/components/ui/accordion';
import { Header } from '@/components/header';
import { MedicalFormSection } from '@/components/medical-form-section';

const initialSections: MedicalSection[] = [
  { id: 'patientInfo', title: 'Información del Paciente', content: 'Nombre: \nEdad: \nSexo: ' },
  { id: 'chiefComplaint', title: 'Motivo de Consulta', content: '' },
  { id: 'presentIllness', title: 'Historia de la Enfermedad Actual', content: '' },
  { id: 'pastHistory', title: 'Antecedentes Médicos', content: '' },
  { id: 'familyHistory', title: 'Antecedentes Familiares', content: '' },
  { id: 'physicalExam', title: 'Examen Físico', content: '' },
  { id: 'diagnosis', title: 'Diagnóstico', content: '' },
  { id: 'plan', title: 'Plan de Tratamiento', content: '' },
];

export interface MedicalSection {
  id: string;
  title: string;
  content: string;
}

export default function Home() {
  const [sections, setSections] = useState<MedicalSection[]>(initialSections);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const handleSectionContentChange = (id: string, newContent: string) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === id ? { ...section, content: newContent } : section
      )
    );
  };

  const handleExportDoc = () => {
    const header = `<h1 style="font-family: Arial, sans-serif; font-size: 24px; font-weight: bold;">Formulario Médico - MediScribe Assist</h1>`;
    const content = sections.map(section => 
        `<h2 style="font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; margin-top: 20px;">${section.title}</h2><p style="font-family: Arial, sans-serif; font-size: 14px; white-space: pre-wrap;">${section.content}</p>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family: Arial, sans-serif;">${header}${content}</body></html>`;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formulario-medico.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const input = formRef.current;
    if (input) {
      setIsLoadingPdf(true);
      html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / pdfWidth;
        const height = canvasHeight / ratio;

        let position = 0;
        let remainingHeight = height;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, height);
        remainingHeight -= pdfHeight;

        while (remainingHeight > 0) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, height);
          remainingHeight -= pdfHeight;
        }

        pdf.save('formulario-medico.pdf');
        setIsLoadingPdf(false);
      }).catch(() => setIsLoadingPdf(false));
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header 
        onExportDoc={handleExportDoc} 
        onExportPdf={handleExportPdf}
        isExportingPdf={isLoadingPdf}
      />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div ref={formRef} className="bg-background rounded-lg p-2 md:p-4">
            <h1 className="text-3xl font-bold mb-6 text-center font-headline text-foreground">
              Formulario Médico
            </h1>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {sections.map((section) => (
                <MedicalFormSection
                  key={section.id}
                  section={section}
                  onContentChange={handleSectionContentChange}
                />
              ))}
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
}
