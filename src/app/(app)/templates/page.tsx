'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MedicalForm } from '@/types/medical-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { defaultTemplate } from '@/lib/forms-utils';

export default function TemplatesPage() {
  const [templates, setTemplates] = useLocalStorage<MedicalForm[]>('medicalForms', [defaultTemplate]);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const createNewTemplate = () => {
    router.push('/new-form');
  };

  const deleteTemplate = (id: string) => {
    if (id === 'default') {
        alert('No se puede eliminar la plantilla predeterminada.');
        return;
    }
    setTemplates(templates.filter(form => form.id !== id));
  };
  
  if (!isClient) {
    return <div>Cargando plantillas...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Plantillas de Formularios</h1>
        <Button onClick={createNewTemplate}>
          <FilePlus className="mr-2 h-4 w-4" />
          Crear Nueva Plantilla
        </Button>
      </div>
       {templates.filter(f => f.isTemplate).length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.filter(f => f.isTemplate).map(template => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                   <Link href={`/new-form?templateId=${template.id}`} className="hover:underline">
                    {template.name}
                  </Link>
                  {template.id !== 'default' && (
                    <Button variant="ghost" size="icon" onClick={() => deleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                    {template.sections.length} secciones
                </p>
                 <Link href={`/new-form?templateId=${template.id}`} passHref>
                    <Button variant="outline" className="mt-4 w-full">
                        Editar
                    </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
         <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No tienes plantillas personalizadas.</p>
          <Button onClick={createNewTemplate}>
            <FilePlus className="mr-2 h-4 w-4" />
            Crea tu primera plantilla
          </Button>
        </div>
      )}
    </div>
  );
}
