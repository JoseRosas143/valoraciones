'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MedicalForm } from '@/types/medical-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus, Trash2, Edit, PlusSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { defaultTemplate, getInitialForm } from '@/lib/forms-utils';

export default function TemplatesPage() {
  const [forms, setForms] = useLocalStorage<MedicalForm[]>('medicalForms', [defaultTemplate]);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const createNewTemplate = () => {
    router.push('/templates/new');
  };
  
  const handleUseTemplate = (templateId: string) => {
    const template = forms.find(t => t.id === templateId);
    if (template) {
        const newForm = getInitialForm(template);
        setForms([...forms, newForm]);
        router.push(`/forms/${newForm.id}`);
    }
  };

  const deleteTemplate = (id: string) => {
    if (id === 'default') {
        alert('No se puede eliminar la plantilla predeterminada.');
        return;
    }
    setForms(forms.filter(form => form.id !== id));
  };
  
  if (!isClient) {
    return <div>Cargando plantillas...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Plantillas de Formularios</h1>
        <Button onClick={createNewTemplate}>
          <PlusSquare className="mr-2 h-4 w-4" />
          Crear Nueva Plantilla
        </Button>
      </div>
       {forms.filter(f => f.isTemplate).length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.filter(f => f.isTemplate).map(template => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                   <span className="hover:underline">
                    {template.name}
                  </span>
                  {template.id !== 'default' && (
                    <Button variant="ghost" size="icon" onClick={() => deleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    {template.sections.length} secciones
                </p>
                <div className="flex flex-col gap-2">
                    <Button onClick={() => handleUseTemplate(template.id)}>
                        <FilePlus className="mr-2 h-4 w-4" />
                        Usar esta plantilla
                    </Button>
                    <Link href={`/templates/edit/${template.id}`} passHref>
                        <Button variant="outline" className="w-full">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                    </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
         <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No tienes plantillas personalizadas.</p>
          <Button onClick={createNewTemplate}>
            <PlusSquare className="mr-2 h-4 w-4" />
            Crea tu primera plantilla
          </Button>
        </div>
      )}
    </div>
  );
}
