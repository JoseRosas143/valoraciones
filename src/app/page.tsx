'use client';

import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Accordion } from '@/components/ui/accordion';
import { Header } from '@/components/header';
import { MedicalFormSection } from '@/components/medical-form-section';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { summarizeMedicalSection } from '@/ai/flows/summarize-medical-section';
import { useToast } from '@/hooks/use-toast';
import type { TranscribeMedicalInterviewOutput } from '@/ai/flows/transcribe-medical-interview';

const initialSections: MedicalSection[] = [
    {
        id: 'hospitalInfo',
        title: 'Encabezado de la Institución y Servicio',
        content: `Nombre del Hospital: 
Servicio Médico: 
Valorado en: 
Cama: 
Fecha: `,
    },
    {
        id: 'datosPaciente',
        title: 'Datos del Paciente',
        content: `Nombre: 
NSS: 
Edad: 
Sexo: 
Fecha de Ingreso: 
Diagnóstico: 
Procedimiento: `,
    },
    {
        id: 'antecedentesHeredofamiliares',
        title: 'Antecedentes Heredofamiliares',
        content: `Madre:
  Edad: 
  Lugar de origen y residencia: 
  Escolaridad: 
  Estado civil: 
  Ocupación: 
  Enfermedades crónico-degenerativas: 
  Hemotipo: 
  Toxicomanías: 
  Medicamentos: 
Padre:
  Edad: 
  Lugar de origen y residencia: 
  Escolaridad: 
  Estado civil: 
  Ocupación: 
  Enfermedades crónico-degenerativas: 
  Hemotipo: 
  Toxicomanías: 
  Medicamentos: 
Hermanos: 
Rama Materna: 
Rama Paterna: 
Consanguinidad: `,
    },
    {
        id: 'antecedentesPerinatales',
        title: 'Antecedentes Perinatales',
        content: `Prenatales:
  Número de gesta: 
  Edad materna: 
  Control prenatal: 
  Ultrasonidos: 
  Ingestión de suplementos: 
  VDRL/VIH: 
  Amenazas de aborto/parto: 
  Patologías gestacionales: 
Natales:
  Tipo de parto: 
  Peso: 
  Talla: 
  Apgar: 
  Complicaciones: 
Postnatales:
  Complicaciones: 
  Tiempo de egreso: 
Desarrollo Psicomotor: 
Tamiz Neonatal:
  Auditivo: 
  Cardiológico: 
  Metabólico: `,
    },
    {
        id: 'antecedentesPersonalesNoPatologicos',
        title: 'Antecedentes Personales No Patológicos',
        content: `Vivienda: 
Higiene: 
Alimentación: 
Inmunizaciones: 
Cuidador Principal: 
Hemotipo: 
Escolaridad: `,
    },
    {
        id: 'antecedentesPersonalesPatologicos',
        title: 'Antecedentes Personales Patológicos',
        content: `Enfermedades crónico-degenerativas: 
Alergias: 
Alergia al látex: 
Convulsiones: 
Asma/broncoespasmos: 
Enfermedades exantemáticas: 
Quirúrgicos: 
Traumatismos: 
Intoxicaciones: 
Transfusiones: 
Hospitalizaciones previas: 
IVRS (Infecciones de Vías Respiratorias Superiores): 
Medicamentos actuales: `,
    },
    {
        id: 'padecimientoActual',
        title: 'Padecimiento Actual',
        content: `Descripción del padecimiento: 
Somatometría
  Talla: 
  Peso real: 
  Tensión arterial: 
  Frecuencia cardiaca: 
  Frecuencia respiratoria: 
  Temperatura: 
  Saturación O2: 
  Superficie corporal: `,
    },
    {
        id: 'exploracionFisica',
        title: 'Exploración Física',
        content: `Descripción general del paciente: 
Piel y tegumentos: 
Cráneo: 
Boca/faringe: 
Vía aérea: 
Cuello: 
Tórax: 
Abdomen: 
Genitales: 
Extremidades: 
Columna vertebral: 
Accesos vasculares: `,
    },
    {
        id: 'laboratoriosEstudios',
        title: 'Laboratorios y Estudios',
        content: `Biometría Hemática: 
Tiempos de Coagulación: 
Otros valores hematológicos: 
Estudios de Gabinete: `,
    },
    {
        id: 'valoracionOtrosServicios',
        title: 'Valoración por Otros Servicios',
        content: `Resumen de las valoraciones de otras especialidades: `,
    },
    {
        id: 'planComentariosAdicionales',
        title: 'Plan y Comentarios Adicionales',
        content: `Espacio Libre para Información Adicional: 
Manejo Médico de su Servicio: 
Riesgo Anestésico Quirúrgico:
  ASA: 
  RAQ: 
  CEPOD: 
  IPID: 
  NARCO SS: 
Volumen Sanguíneo Circulante: 
Sangrado Permisible: 
Plan Anestésico: 
Indicaciones Anestésicas: 
Comentario Bibliográfico: `,
    },
];

export interface MedicalSection {
  id: string;
  title: string;
  content: string;
}

// Helper to format a string from a nested object for display
function formatContent(data: any, indent = ''): string {
    return Object.entries(data)
        .map(([key, value]) => {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                return `${indent}${formattedKey}:\n${formatContent(value, `${indent}  `)}`;
            }
            return `${indent}${formattedKey}: ${value || ''}`;
        })
        .join('\n');
}

export default function Home() {
  const [sections, setSections] = useState<MedicalSection[]>(initialSections);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleAllSectionsContentChange = (fullData: TranscribeMedicalInterviewOutput) => {
    const newSections = sections.map(section => {
      const sectionData = fullData[section.id as keyof TranscribeMedicalInterviewOutput];
      if (sectionData && typeof sectionData === 'object') {
        return { ...section, content: formatContent(sectionData) };
      }
      return section;
    });
    setSections(newSections);
  };

  const handleSectionContentChange = (id: string, newContent: string) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === id ? { ...section, content: newContent } : section
      )
    );
  };
  
  const handleSectionTitleChange = (id: string, newTitle: string) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === id ? { ...section, title: newTitle } : section
      )
    );
  }

  const handleDeleteSection = (id: string) => {
    setSections(prevSections => prevSections.filter(section => section.id !== id));
  }

  const handleAddSection = () => {
    const newSection: MedicalSection = {
      id: `custom-${Date.now()}`,
      title: 'Nueva Sección',
      content: '',
    };
    setSections(prevSections => [...prevSections, newSection]);
  };

  const handleSummarizeSection = async (id: string) => {
    const section = sections.find(s => s.id === id);
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

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newSections = [...sections];
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      setSections(newSections);
    }
    if (direction === 'down' && index < sections.length - 1) {
      const newSections = [...sections];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      setSections(newSections);
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
              {sections.map((section, index) => (
                <MedicalFormSection
                  key={section.id}
                  section={section}
                  onContentChange={handleSectionContentChange}
                  onAllSectionsContentChange={handleAllSectionsContentChange}
                  onTitleChange={handleSectionTitleChange}
                  onDelete={handleDeleteSection}
                  onSummarize={handleSummarizeSection}
                  isSummarizing={isSummarizing === section.id}
                  onMove={(direction) => handleMoveSection(index, direction)}
                  isFirst={index === 0}
                  isLast={index === sections.length - 1}
                />
              ))}
            </Accordion>
             <div className="mt-6 text-center">
                <Button onClick={handleAddSection} variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Sección
                </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
