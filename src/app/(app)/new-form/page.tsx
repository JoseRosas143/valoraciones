
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MedicalForm } from '@/types/medical-form';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FilePlus, PlusSquare, Loader2, Gem } from 'lucide-react';
import { getInitialForm } from '@/lib/forms-utils';
import { useToast } from '@/hooks/use-toast';

const FREE_FORM_LIMIT = 4;

export default function NewFormPage() {
  const [templates, setTemplates] = useState<MedicalForm[]>([]);
  const [formCount, setFormCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoading(true);
      try {
        // Fetch templates
        const templatesRef = collection(db, 'users', user.uid, 'forms');
        const templatesQuery = query(templatesRef, where('isTemplate', '==', true));
        const templatesSnapshot = await getDocs(templatesQuery);
        const userTemplates = templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalForm));
        setTemplates(userTemplates);

        // Fetch form count
        const formsRef = collection(db, 'users', user.uid, 'forms');
        const formsQuery = query(formsRef, where('isTemplate', '!=', true));
        const formsSnapshot = await getDocs(formsQuery);
        setFormCount(formsSnapshot.size);

      } catch (error) {
        console.error("Error fetching data: ", error);
        toast({ variant: 'destructive', title: 'Error al cargar datos' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user, toast]);
  
  const handleCreateFromTemplate = async (templateId: string) => {
    if (!user) return;

    if (formCount >= FREE_FORM_LIMIT) {
        toast({
            variant: 'destructive',
            title: 'Límite de formularios gratuitos alcanzado',
            description: `Por favor, actualice su plan para crear más de ${FREE_FORM_LIMIT} formularios.`,
        });
        return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
        try {
            const initialForm = getInitialForm(template);
             // Firestore generates the ID, so we don't save the 'id' field in the document.
            const { id, ...newFormData } = initialForm;
            const formsRef = collection(db, 'users', user.uid, 'forms');
            const docRef = await addDoc(formsRef, newFormData);
            router.push(`/forms/${docRef.id}`);
        } catch(e) {
            console.error("Error creating from template: ", e);
            toast({ variant: 'destructive', title: 'Error al crear formulario' });
        }
    }
  };

  const createNewTemplate = () => {
    router.push('/templates');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const canCreateMore = formCount < FREE_FORM_LIMIT;

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Crear Formulario desde Plantilla</h1>
             <p className="text-muted-foreground">Has usado {formCount} de {FREE_FORM_LIMIT} formularios gratuitos.</p>
        </div>
        <Button onClick={createNewTemplate} variant="outline">
          <PlusSquare className="mr-2 h-4 w-4" />
          Gestionar Plantillas
        </Button>
      </div>

       {!canCreateMore && (
         <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">Has alcanzado tu límite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
                Has utilizado todos tus formularios gratuitos. Para crear más, por favor, considera actualizar tu plan.
            </p>
             <Button className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => router.push('/pricing')}>
                <Gem className="mr-2 h-4 w-4" />
                Ver Planes de Suscripción
            </Button>
          </CardContent>
        </Card>
      )}

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <Card key={template.id} className={!canCreateMore ? 'opacity-50' : ''}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                    {template.sections.length} secciones
                </p>
                <Button onClick={() => handleCreateFromTemplate(template.id)} className="mt-4 w-full" disabled={!canCreateMore}>
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
