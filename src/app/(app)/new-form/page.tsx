'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MedicalForm } from '@/types/medical-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus, PlusSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { defaultTemplate, getInitialForm } from '@/lib/forms-utils';

export default function NewFormPage() {
  const [templates, setTemplates] = useLocalStorage<MedicalForm[]>('medicalForms', [defaultTemplate]);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleCreateFromTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
        const newForm = getInitialForm(template);
        // We need to add the new form to the list of forms before navigating
        const allForms = templates; // This actually gets all forms from local storage
        setTemplates([...allForms, newForm]);
        router.push(`/forms/${newForm.id}`);
    }
  };

  const createNewTemplate = () => {
    router.push('/templates/new');
  };

  if (!isClient) {
    return <div>Cargando plantillas...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Crear Formulario desde Plantilla</h1>
        <Button onClick={createNewTemplate} variant="outline">
          <PlusSquare className="mr-2 h-4 w-4" />
          Gestionar Plantillas
        </Button>
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.filter(f => f.isTemplate).map(template => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                    {template.sections.length} secciones
                </p>
                <Button onClick={() => handleCreateFromTemplate(template.id)} className="mt-4 w-full">
                    <FilePlus className="mr-2 h-4 w-4" />
                    Usar esta plantilla
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
}
