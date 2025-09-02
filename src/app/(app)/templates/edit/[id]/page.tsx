'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Accordion } from '@/components/ui/accordion';
import { MedicalFormSection } from '@/components/medical-form-section';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MedicalForm, MedicalSection } from '@/types/medical-form';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Input } from '@/components/ui/input';
import { nanoid } from 'nanoid';
import { PlusCircle, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { defaultTemplate } from '@/lib/forms-utils';

export default function TemplateEditorPage() {
    const router = useRouter();
    const params = useParams();
    const templateId = params.id as string;

    const [forms, setForms] = useLocalStorage<MedicalForm[]>('medicalForms', [defaultTemplate]);
    const [currentForm, setCurrentForm] = useState<MedicalForm | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (templateId) {
            const template = forms.find(f => f.id === templateId && f.isTemplate);
            if (template) {
                setCurrentForm({ ...template });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Plantilla no encontrada',
                });
                router.push('/templates');
            }
        }
    }, [templateId, forms, router, toast]);

    const updateCurrentForm = (updatedForm: MedicalForm) => {
        setCurrentForm(updatedForm);
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

    const handleMoveSection = useCallback((index: number, direction: 'up' | 'down') => {
        if (!currentForm) return;
        const newSections = [...currentForm.sections];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < newSections.length) {
            [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
            updateCurrentForm({ ...currentForm, sections: newSections });
        }
    }, [currentForm]);


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
        return <div>Cargando editor...</div>;
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
                            {currentForm.sections.map((section, index) => (
                                <MedicalFormSection
                                    key={section.id}
                                    section={section}
                                    onContentChange={() => {}} // Content is not editable in template editor
                                    isSummarizing={false}
                                    onSave={() => {}} // Not used in template editor
                                    isEditable={true}
                                    onTitleChange={handleTitleChange}
                                    onDelete={handleDeleteSection}
                                    // Pass dummy functions for non-applicable props
                                    onAllSectionsContentChange={() => {}}
                                    onReset={() => {}}
                                    onSummarize={() => {}}
                                    onMove={direction => handleMoveSection(index, direction)}
                                    isFirst={index === 0}
                                    isLast={index === currentForm.sections.length - 1}
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
