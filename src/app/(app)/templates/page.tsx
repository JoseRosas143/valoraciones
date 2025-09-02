
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MedicalForm } from '@/types/medical-form';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus, Trash2, Edit, PlusSquare, Loader2 } from 'lucide-react';
import { getInitialForm, defaultTemplates, noteTemplate } from '@/lib/forms-utils';
import { useToast } from '@/hooks/use-toast';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MedicalForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTemplates() {
      if (!user) return;
      setIsLoading(true);
      try {
        const templatesRef = collection(db, 'users', user.uid, 'forms');
        const q = query(templatesRef, where('isTemplate', '==', true));
        const querySnapshot = await getDocs(q);
        const userTemplates = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalForm));

        // Create a map of existing templates by ID for quick lookup
        const templateMap = new Map(userTemplates.map(t => [t.id, t]));
        
        // Add default templates if they are not in the fetched data
        if (!templateMap.has(defaultTemplates.id)) {
            templateMap.set(defaultTemplates.id, defaultTemplates);
        }
        if (!templateMap.has(noteTemplate.id)) {
            templateMap.set(noteTemplate.id, noteTemplate);
        }
        
        setTemplates(Array.from(templateMap.values()));
      } catch (error) {
        console.error("Error fetching templates: ", error);
        toast({
          variant: 'destructive',
          title: 'Error al cargar plantillas',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, [user, toast]);

  const createNewTemplate = () => {
    router.push('/templates/new');
  };
  
  const handleUseTemplate = async (templateId: string) => {
    if (!user) return;
    
    const template = templates.find(t => t.id === templateId);

    if (template) {
      try {
        // If the template is a default one (and thus doesn't have a Firestore ID yet for this user),
        // we need to save it to the user's collection first to make it their own.
        // We use setDoc to ensure the ID is 'default' or 'note' for the first time.
        const isDefault = template.id === 'default' || template.id === 'note';
        const userTemplateRef = doc(db, 'users', user.uid, 'forms', template.id);
        
        // Check if this default template already exists for the user. If not, create it.
        // This is a simplified check. A more robust way might involve a separate 'isDefault' flag.
        // For now, this logic is okay.
        if (isDefault) {
           await setDoc(userTemplateRef, template, { merge: true });
        }
        
        const initialForm = getInitialForm(template);
        // Important: remove the template's ID before creating a new form document
        const { id, ...newFormData } = initialForm; 
        
        const formsRef = collection(db, 'users', user.uid, 'forms');
        const docRef = await addDoc(formsRef, newFormData);
        router.push(`/forms/${docRef.id}`);
      } catch(error) {
         console.error("Error creating form from template: ", error);
         toast({
            variant: 'destructive',
            title: 'Error al usar plantilla',
            description: 'No se pudo crear un formulario desde esta plantilla.',
         });
      }
    }
  };

  const deleteTemplate = async (id: string) => {
     if (!user) return;
    if (id === 'default' || id === 'note') {
        toast({
            variant: 'destructive',
            title: 'Acción no permitida',
            description: 'No se pueden eliminar las plantillas predeterminadas.',
        });
        return;
    }
    try {
        await deleteDoc(doc(db, 'users', user.uid, 'forms', id));
        setTemplates(templates.filter(t => t.id !== id));
        toast({ title: 'Plantilla eliminada' });
    } catch(e) {
        console.error("Error deleting template: ", e);
        toast({ variant: 'destructive', title: 'Error al eliminar' });
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
       {templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                   <span className="hover:underline flex-1 pr-2">
                    {template.name}
                  </span>
                  {(template.id !== 'default' && template.id !== 'note') && (
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
                    {(template.id !== 'default' && template.id !== 'note') && (
                        <Link href={`/templates/edit/${template.id}`} passHref>
                            <Button variant="outline" className="w-full">
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                        </Link>
                    )}
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
