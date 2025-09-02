
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MedicalForm } from '@/types/medical-form';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { getInitialForm } from '@/lib/forms-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus, Trash2, Loader2, Gem } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FREE_FORM_LIMIT = 4;

export default function FormsPage() {
  const [forms, setForms] = useState<MedicalForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchForms() {
      if (!user) return;
      try {
        const formsRef = collection(db, 'users', user.uid, 'forms');
        const q = query(formsRef);
        const querySnapshot = await getDocs(q);
        const userForms = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as MedicalForm))
          .filter(form => !form.isTemplate);
        setForms(userForms);
      } catch (error) {
        console.error("Error fetching forms: ", error);
        toast({
          variant: 'destructive',
          title: 'Error al cargar formularios',
          description: 'No se pudieron recuperar los formularios guardados.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchForms();
  }, [user, toast]);

  const createNewForm = async () => {
    if (!user) return;
    
    if (forms.length >= FREE_FORM_LIMIT) {
        toast({
            variant: 'destructive',
            title: 'Límite alcanzado',
            description: `Has alcanzado el límite de ${FREE_FORM_LIMIT} formularios gratuitos. Actualiza tu plan para crear más.`,
        });
        return;
    }

    setIsCreating(true);
    try {
      const initialForm = getInitialForm();
      // Firestore generates the ID, so we don't save the 'id' field in the document.
      const { id, ...newFormData } = initialForm;
      const formsRef = collection(db, 'users', user.uid, 'forms');
      const docRef = await addDoc(formsRef, newFormData);
      router.push(`/forms/${docRef.id}`);
    } catch (error) {
      console.error("Error creating new form: ", error);
       toast({
          variant: 'destructive',
          title: 'Error al crear',
          description: 'No se pudo crear el nuevo formulario.',
        });
      setIsCreating(false);
    }
  };

  const deleteForm = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'forms', id));
      setForms(forms.filter(form => form.id !== id));
      toast({
        title: 'Formulario eliminado',
        description: 'El formulario ha sido eliminado correctamente.',
      });
    } catch (error) {
      console.error("Error deleting form: ", error);
       toast({
          variant: 'destructive',
          title: 'Error al eliminar',
          description: 'No se pudo eliminar el formulario.',
        });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const canCreateMore = forms.length < FREE_FORM_LIMIT;

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Formularios Guardados</h1>
        <div className="flex flex-col items-end">
            <Button onClick={createNewForm} disabled={isCreating || !canCreateMore}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
              Crear Nuevo
            </Button>
            <p className="text-sm text-muted-foreground mt-1">
                {forms.length}/{FREE_FORM_LIMIT} formularios gratuitos utilizados
            </p>
        </div>
      </div>
      {!canCreateMore && (
         <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">Has alcanzado tu límite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
                Has utilizado tus {FREE_FORM_LIMIT} formularios gratuitos. Para crear más, por favor, considera actualizar tu plan.
            </p>
             <Button className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => router.push('/pricing')}>
                <Gem className="mr-2 h-4 w-4" />
                Ver Planes de Suscripción
            </Button>
          </CardContent>
        </Card>
      )}
      {forms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map(form => (
            <Card key={form.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <Link href={`/forms/${form.id}`} className="hover:underline pr-2 flex-1">
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
          <Button onClick={createNewForm} disabled={isCreating}>
             {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
            Crea tu primer formulario
          </Button>
        </div>
      )}
    </div>
  );
}
