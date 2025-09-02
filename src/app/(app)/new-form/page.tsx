'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import { Accordion } from '@/components/ui/accordion';
import { Header } from '@/components/header';
import { MedicalFormSection } from '@/components/medical-form-section';
import { Button } from '@/components/ui/button';
import { summarizeMedicalSection } from '@/ai/flows/summarize-medical-section';
import { useToast } from '@/hooks/use-toast';
import { MedicalForm, MedicalSection } from '@/types/medical-form';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Input } from '@/components/ui/input';
import { nanoid } from 'nanoid';
import { PlusCircle, Save } from 'lucide-react';
import { defaultTemplate } from '@/lib/forms-utils';

function formatContent(data: any, indent = ''): string {
    if (!data) return '';
    if (typeof data !== 'object') return `${indent}${data}`;
    return Object.entries(data)
        .map(([key, value]) => {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                return `${indent}${formattedKey}:\n${formatContent(value, `${indent}  `)}`;
            }
            if (value) return `${indent}${formattedKey}: ${value}`;
            return `${indent}${formattedKey}: `;
        })
        .join('\n');
}

export default function NewFormPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const templateId = searchParams.get('templateId');

    const [forms, setForms] = useLocalStorage<MedicalForm[]>('medicalForms', [defaultTemplate]);
    const [currentForm, setCurrentForm] = useState<MedicalForm | null>(null);
    const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (templateId) {
            const template = forms.find(f => f.id === templateId && f.isTemplate);
            setCurrentForm(template ? { ...template } : createNewTemplate());
        } else {
            setCurrentForm(createNewTemplate());
        }
    }, [templateId, forms]);

    const createNewTemplate = (): MedicalForm => {
        return {
            id: nanoid(),
            name: 'Nueva Plantilla de Formulario',
            sections: [],
            isTemplate: true,
        };
    };

    const updateCurrentForm = (updatedForm: MedicalForm) => {
        setCurrentForm(updatedForm);
    };

    const handleSectionContentChange = (id: string, newContent: string) => {
        if (!currentForm) return;
        const newSections = currentForm.sections.map(section =>
            section.id === id ? { ...section, content: newContent } : section
        );
        updateCurrentForm({ ...currentForm, sections: newSections });
    };

    const handleTitleChange = (id: string, newTitle: string) => {
        if (!currentForm) return;
        const newSections = currentForm.sections.map(section =>
            section.id === id ? { ...section, title: newTitle } : section
        );
        updateCurrentForm({ ...currentForm, sections: newSections });
    };

    const handleDeleteSection = (id: string) => {
        if (!currentForm) return;
        const newSections = currentForm.sections.filter(section => section.id !== id);
        updateCurrentForm({ ...currentForm, sections: newSections });
    };

    const handleAddSection = () => {
        if (!currentForm) return;
        const newSection: MedicalSection = {
            id: nanoid(),
            title: 'Nueva Sección',
            content: '',
        };
        updateCurrentForm({ ...currentForm, sections: [...currentForm.sections, newSection] });
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

    const handleSaveTemplate = () => {
        if (!currentForm) return;
        const existingIndex = forms.findIndex(f => f.id === currentForm.id);
        let newForms;
        if (existingIndex > -1) {
            newForms = forms.map((f, index) => index === existingIndex ? currentForm : f);
        } else {
            newForms = [...forms, currentForm];
        }
        setForms(newForms);
        toast({
            title: 'Plantilla Guardada',
            description: `La plantilla "${currentForm.name}" ha sido guardada.`,
        });
        router.push('/templates');
    };

    if (!currentForm) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
             <header className="bg-card border-b p-4 shadow-sm sticky top-0 z-10">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Editor de Plantillas</h1>
                    <Button onClick={handleSaveTemplate}>
                        <Save className="mr-2 h-4 w-4"/>
                        Guardar Plantilla
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-background rounded-lg p-2 md:p-4">
                        <Input
                            value={currentForm.name}
                            onChange={(e) => updateCurrentForm({ ...currentForm, name: e.target.value })}
                            className="text-3xl font-bold mb-6 text-center"
                            placeholder="Nombre de la Plantilla"
                        />
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {currentForm.sections.map((section) => (
                                <MedicalFormSection
                                    key={section.id}
                                    section={section}
                                    onContentChange={handleSectionContentChange}
                                    onSummarize={handleSummarizeSection}
                                    isSummarizing={isSummarizing === section.id}
                                    onSave={() => {}} // Not used in template editor
                                    isEditable={true}
                                    onTitleChange={handleTitleChange}
                                    onDelete={handleDeleteSection}
                                    // Pass dummy functions for non-applicable props
                                    onAllSectionsContentChange={() => {}}
                                    onReset={() => {}}
                                />
                            ))}
                        </Accordion>
                        <div className="mt-6 text-center">
                            <Button variant="outline" onClick={handleAddSection}>
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Agregar Sección
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
