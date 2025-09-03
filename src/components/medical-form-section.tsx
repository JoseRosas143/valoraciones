
'use client';

import { useState, useRef, useEffect } from 'react';
import type { MedicalSection } from '@/types/medical-form';
import { transcribeMedicalInterview, TranscribeMedicalInterviewOutput, TranscribeMedicalInterviewInput } from '@/ai/flows/transcribe-medical-interview';
import { transcribeDynamicForm, TranscribeDynamicFormInput, TranscribeDynamicFormOutput } from '@/ai/flows/transcribe-dynamic-form';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mic, Square, Loader2, Clipboard, Check, RotateCcw, BrainCircuit, Save, Trash2, ArrowUp, ArrowDown, FileQuestion, MessageSquareText } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface MedicalFormSectionProps {
  section: MedicalSection;
  onContentChange: (id: string, newContent: string) => void;
  onAllSectionsContentChange?: (fullData: TranscribeMedicalInterviewOutput | TranscribeDynamicFormOutput) => void;
  onReset: (id: string) => void;
  onSummarize: (id: string) => void;
  onSuggestDiagnosis: (id: string) => void;
  isSummarizing: boolean;
  isDiagnosing: boolean;
  onSave: () => void;
  isSaving?: boolean;
  onTitleChange?: (id: string, newTitle: string) => void;
  onAiPromptChange?: (id: string, newPrompt: string) => void;
  onDelete?: (id: string) => void;
  isEditable: boolean;
  onMove?: (direction: 'up' | 'down') => void;
  isFirst?: boolean;
  isLast?: boolean;
  isNote?: boolean;
  isCustomTemplate?: boolean;
  allSections?: MedicalSection[]; // Pass all sections for transcription context
  generalAiPrompt?: string;
  fullTranscription?: string;
}

export function MedicalFormSection({
  section,
  onContentChange,
  onAllSectionsContentChange,
  onReset,
  onSummarize,
  onSuggestDiagnosis,
  isSummarizing,
  isDiagnosing,
  onSave,
  isSaving,
  onTitleChange,
  onAiPromptChange,
  onDelete,
  isEditable,
  onMove,
  isFirst,
  isLast,
  isNote = false,
  isCustomTemplate = false,
  allSections = [],
  generalAiPrompt = '',
  fullTranscription = '',
}: MedicalFormSectionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isOriginalTranscriptionCopied, setIsOriginalTranscriptionCopied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            let result: TranscribeMedicalInterviewOutput | TranscribeDynamicFormOutput;
            
            const sectionsForAI = allSections.map(s => ({
              id: s.id,
              title: s.title,
              aiPrompt: s.aiPrompt,
            }));

            if (isCustomTemplate) {
                 const transcriptionInput: TranscribeDynamicFormInput = {
                    audioDataUri: base64Audio,
                    generalAiPrompt: generalAiPrompt,
                    sections: sectionsForAI,
                 };
                 result = await transcribeDynamicForm(transcriptionInput);
            } else {
                const transcriptionInput: TranscribeMedicalInterviewInput = {
                    audioDataUri: base64Audio,
                    generalAiPrompt: generalAiPrompt,
                    sections: sectionsForAI,
                };
                result = await transcribeMedicalInterview(transcriptionInput);
            }
            
            if (onAllSectionsContentChange) {
                onAllSectionsContentChange(result);
            }

            toast({
              title: 'Transcripción Completa',
              description: 'El formulario ha sido actualizado con la información del audio.',
            });
          } catch (error) {
            console.error('Transcription failed:', error);
            toast({
              variant: 'destructive',
              title: 'Error de Transcripción',
              description: 'No se pudo transcribir el audio. Por favor, inténtelo de nuevo.',
            });
          } finally {
            setIsTranscribing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
    } catch (error) {
      console.error('Could not get microphone access:', error);
      toast({
        variant: 'destructive',
        title: 'Error de Micrófono',
        description: 'No se pudo acceder al micrófono. Por favor, compruebe los permisos.',
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handleCopy = () => {
    if (section.content) {
      navigator.clipboard.writeText(section.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCopyOriginalTranscription = () => {
    if (fullTranscription) {
        navigator.clipboard.writeText(fullTranscription);
        setIsOriginalTranscriptionCopied(true);
        setTimeout(() => setIsOriginalTranscriptionCopied(false), 2000);
    }
  }

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <AccordionItem value={section.id} className="bg-card border-none rounded-lg shadow-sm overflow-hidden">
        <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
          <div className="flex items-center gap-2 w-full">
                <span className="flex-1 text-left">{section.title}</span>
          </div>
        </AccordionTrigger>
      <AccordionContent className="px-6 pb-6 pt-4">
        {isEditable && onTitleChange ? (
            <div className="mb-4">
                <Label htmlFor={`title-input-${section.id}`}>Título de la Sección</Label>
                <Input
                    id={`title-input-${section.id}`}
                    value={section.title}
                    onChange={(e) => onTitleChange(section.id, e.target.value)}
                    className="text-lg font-semibold"
                />
            </div>
        ) : null}
        <div className="flex justify-end items-center mb-2">
            <div className="flex items-center">
              {!isEditable && (
                  <Button variant="ghost" size="icon" onClick={onSave} className="h-8 w-8 text-muted-foreground hover:text-foreground" disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      <span className="sr-only">Guardar Formulario</span>
                  </Button>
              )}
              {!isEditable && (
                  <Button variant="ghost" size="icon" onClick={() => onReset(section.id)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-5 w-5" />
                      <span className="sr-only">Reiniciar sección</span>
                  </Button>
              )}

              {isEditable && onMove && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => onMove('up')} disabled={isFirst} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <ArrowUp className="h-5 w-5" />
                    <span className="sr-only">Mover hacia arriba</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onMove('down')} disabled={isLast} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <ArrowDown className="h-5 w-5" />
                    <span className="sr-only">Mover hacia abajo</span>
                  </Button>
                </>
              )}
              {isEditable && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(section.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Eliminar sección</span>
                </Button>
              )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className='flex items-center gap-2'>
              {!isEditable && onAllSectionsContentChange && (
                <Button onClick={handleToggleRecording} variant="outline" size="sm" disabled={isTranscribing || isSummarizing || isDiagnosing}>
                  {isRecording ? <Square className="mr-2 h-4 w-4 text-red-500 fill-current" /> : <Mic className="mr-2 h-4 w-4" />}
                  {isRecording ? 'Detener' : 'Grabar y Rellenar'}
                </Button>
              )}
              {!isEditable && (
                <Button onClick={() => onSummarize(section.id)} variant="outline" size="sm" disabled={isTranscribing || isSummarizing || isDiagnosing || !section.content}>
                    {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                    {isNote ? 'Resumen Clínico' : 'Resumir Sección'}
                </Button>
              )}
               {isNote && !isEditable && (
                <Button onClick={() => onSuggestDiagnosis(section.id)} variant="outline" size="sm" disabled={isTranscribing || isSummarizing || isDiagnosing || !section.content}>
                    {isDiagnosing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileQuestion className="mr-2 h-4 w-4" />}
                    Posible Diagnóstico
                </Button>
              )}
               {!isEditable && fullTranscription && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MessageSquareText className="mr-2 h-4 w-4" />
                      Ver Grabación Original
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Transcripción Original Completa</AlertDialogTitle>
                      <AlertDialogDescription
                        className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap p-2 bg-muted rounded-md"
                      >
                        {fullTranscription}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cerrar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCopyOriginalTranscription}>
                         {isOriginalTranscriptionCopied ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Clipboard className="mr-2 h-4 w-4" />}
                        {isOriginalTranscriptionCopied ? 'Copiado' : 'Copiar'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex items-center gap-4 h-9">
              {isRecording && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Grabando...
                </div>
              )}
              {(isTranscribing || isSummarizing || isDiagnosing) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin h-4 w-4" />
                  {isTranscribing ? 'Transcribiendo...' : (isSummarizing ? 'Resumiendo...' : 'Analizando...')}
                </div>
              )}
            </div>
          </div>

          {isEditable && onAiPromptChange && (
            <div className="space-y-2">
              <Label htmlFor={`ai-prompt-${section.id}`}>Indicaciones para la IA (Opcional)</Label>
              <Textarea
                id={`ai-prompt-${section.id}`}
                placeholder="Ej: Transcripción literal, enfocarse solo en datos médicos, etc."
                value={section.aiPrompt}
                onChange={(e) => onAiPromptChange(section.id, e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          )}

          <div className="relative">
            <Textarea
              value={section.content}
              onChange={(e) => onContentChange(section.id, e.target.value)}
              placeholder={isEditable ? "El contenido de esta sección se genera automáticamente al usar la plantilla." : "Haga clic en 'Grabar' para transcribir o escriba aquí..."}
              rows={isEditable ? 3 : 12}
              className="pr-12 text-base"
              disabled={isEditable || isTranscribing || isSummarizing || isDiagnosing}
            />
            {!isEditable && (
                <Button onClick={handleCopy} variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground" disabled={!section.content}>
                <span className="sr-only">Copiar al portapapeles</span>
                {isCopied ? <Check className="h-5 w-5 text-green-600" /> : <Clipboard className="h-5 w-5" />}
                </Button>
            )}
          </div>
          {section.summary && (
            <div className="mt-4 space-y-2">
                <Label>Resumen / Diagnóstico (IA)</Label>
                <div className="p-3 rounded-md border bg-muted/50 text-sm text-muted-foreground whitespace-pre-wrap">
                    {section.summary}
                </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
