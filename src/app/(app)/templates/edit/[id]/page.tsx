'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Accordion } from '@/components/ui/accordion';
import { MedicalFormSection } from '@/components/medical-form-section';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MedicalForm, MedicalSection } from '@/types/medical-form';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { nanoid } from 'nanoid';
import { PlusCircle, Save, Loader2 } from 'lucide-react';

export default function TemplateEditorPage() {
    const router = useRouter();
    const params = useParams();
    const templateId = params.id as string;

    const [currentForm, setCurrentForm] = useState<MedicalForm | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchTemplate() {
            if (templateId && user) {
                try {
                    const templateRef = doc(db, 'users', user.uid, 'forms', templateId);
                    const docSnap = await getDoc(templateRef);
                    if (docSnap.exists() && docSnap.data().isTemplate) {
                        setCurrentForm({ id: docSnap.id, ...docSnap.data() } as MedicalForm);
                    } else {
                        toast({ variant: 'destructive', title: 'Plantilla no encontrada' });
                        router.push('/templates');
                    }
                } catch (error) {
                     toast({ variant: 'destructive', title: 'Error al cargar plantilla' });
                     router.push('/templates');
                } finally {
                    setIsLoading(false);
                }
            }
        }
        fetchTemplate();
    }, [templateId, user, router, toast]);

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

    const handleAiPromptChange = (id: string, newPrompt: string) => {
        if (!currentForm) return;
        const newSections = currentForm.sections.map(section =>
            section.id === id ? { ...section, aiPrompt: newPrompt } : section
        );
        updateCurrentForm({ ...currentForm, sections: newSections });
    }

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
            aiPrompt: '',
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


    const handleSaveTemplate = async () => {
        if (!currentForm || !user) return;
        setIsSaving(true);
        try {
            const templateRef = doc(db, 'users', user.uid, 'forms', currentForm.id);
            const { id, ...templateData } = currentForm;
            await setDoc(templateRef, templateData, { merge: true });
            toast({
                title: 'Plantilla Guardada',
                description: `La plantilla "${currentForm.name}" ha sido guardada.`,
            });
            router.push('/templates');
        } catch(e) {
            console.error("Error saving template: ", e);
            toast({ variant: 'destructive', title: 'Error al guardar' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !currentForm) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
             <header className="bg-card border-b p-4 shadow-sm sticky top-0 z-10">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Editor de Plantillas</h1>
                    <Button onClick={handleSaveTemplate} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                        Guardar Plantilla
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-background rounded-lg p-2 md:p-4 space-y-6">
                        <div className="space-y-2">
                             <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                            <Input
                                id="template-name"
                                value={currentForm.name}
                                onChange={(e) => updateCurrentForm({ ...currentForm, name: e.target.value })}
                                className="text-2xl font-bold"
                                placeholder="Nombre de la Plantilla"
                            />
                        </div>

                         <div className="space-y-2">
                          <Label htmlFor="general-ai-prompt">Instrucción General para la IA</Label>
                          <Textarea
                            id="general-ai-prompt"
                            placeholder="Ej: Eres un asistente médico experto en valoraciones preanestésicas. Tu tono debe ser formal y clínico."
                            value={currentForm.generalAiPrompt}
                            onChange={(e) => updateCurrentForm({ ...currentForm, generalAiPrompt: e.target.value })}
                            rows={3}
                            className="text-sm"
                          />
                        </div>

                        <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={currentForm.sections[0]?.id}>
                            {currentForm.sections.map((section, index) => (
                                <MedicalFormSection
                                    key={section.id}
                                    section={section}
                                    onContentChange={() => {}} // Content is not editable in template editor
                                    isSummarizing={false}
                                    isDiagnosing={false}
                                    onSave={() => {}} // Not used in template editor
                                    isEditable={true}
                                    onTitleChange={handleTitleChange}
                                    onAiPromptChange={handleAiPromptChange}
                                    onDelete={handleDeleteSection}
                                    onReset={() => {}}
                                    onSummarize={() => {}}
                                    onSuggestDiagnosis={() => {}}
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
