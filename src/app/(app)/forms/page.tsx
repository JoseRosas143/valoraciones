'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MedicalForm } from '@/types/medical-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus, Trash2 } from 'lucide-react';
import { getInitialForm } from '@/lib/forms-utils';
import { useRouter } from 'next/navigation';

export default function FormsPage() {
  const [forms, setForms] = useLocalStorage<MedicalForm[]>('medicalForms', []);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const createNewForm = () => {
    const newForm = getInitialForm();
    setForms([...forms, newForm]);
    router.push(`/forms/${newForm.id}`);
  };

  const deleteForm = (id: string) => {
    setForms(forms.filter(form => form.id !== id));
  };

  if (!isClient) {
    return <div>Cargando formularios...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Formularios Guardados</h1>
        <Button onClick={createNewForm}>
          <FilePlus className="mr-2 h-4 w-4" />
          Crear Nuevo
        </Button>
      </div>
      {forms.filter(f => !f.isTemplate).length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.filter(f => !f.isTemplate).map(form => (
            <Card key={form.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <Link href={`/forms/${form.id}`} className="hover:underline">
                    {form.name}
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => deleteForm(form.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Última actualización: {form.updatedAt ? new Date(form.updatedAt).toLocaleString() : 'N/A'}
                </p>
                <Link href={`/forms/${form.id}`} passHref>
                    <Button variant="outline" className="mt-4 w-full">
                        Abrir
                    </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No has guardado ningún formulario todavía.</p>
          <Button onClick={createNewForm}>
            <FilePlus className="mr-2 h-4 w-4" />
            Crea tu primer formulario
          </Button>
        </div>
      )}
    </div>
  );
}
