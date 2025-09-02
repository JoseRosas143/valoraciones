'use client';

import { useState, useRef, useEffect } from 'react';
import type { MedicalSection } from '@/types/medical-form';
import { transcribeMedicalInterview, TranscribeMedicalInterviewOutput } from '@/ai/flows/transcribe-medical-interview';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mic, Square, Loader2, Clipboard, Check, RotateCcw, BrainCircuit, Save, Trash2 } from 'lucide-react';
import { Input } from './ui/input';

interface MedicalFormSectionProps {
  section: MedicalSection;
  onContentChange: (id: string, newContent: string) => void;
  onAllSectionsContentChange: (fullData: TranscribeMedicalInterviewOutput) => void;
  onReset: (id: string) => void;
  onSummarize: (id: string) => void;
  isSummarizing: boolean;
  onSave: () => void;
  onTitleChange?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
  isEditable: boolean;
}

export function MedicalFormSection({
  section,
  onContentChange,
  onAllSectionsContentChange,
  onReset,
  onSummarize,
  isSummarizing,
  onSave,
  onTitleChange,
  onDelete,
  isEditable,
}: MedicalFormSectionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
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
            const result = await transcribeMedicalInterview({ audioDataUri: base64Audio });
            onAllSectionsContentChange(result);
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
            {isEditable && onTitleChange ? (
              <Input
                value={section.title}
                onChange={(e) => onTitleChange(section.id, e.target.value)}
                className="text-lg font-semibold"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-left">{section.title}</span>
            )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6 pt-4">
        <div className="flex justify-end items-center mb-2">
             <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={onSave} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Save className="h-5 w-5" />
                    <span className="sr-only">Guardar Formulario</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onReset(section.id)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <RotateCcw className="h-5 w-5" />
                    <span className="sr-only">Reiniciar sección</span>
                </Button>
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
          <div className="flex items-start gap-4">
            <div className='flex flex-col gap-2'>
              {!isEditable && (
                <Button onClick={handleToggleRecording} variant="outline" size="sm" disabled={isTranscribing || isSummarizing}>
                  {isRecording ? <Square className="mr-2 h-4 w-4 text-red-500 fill-current" /> : <Mic className="mr-2 h-4 w-4" />}
                  {isRecording ? 'Detener' : 'Grabar y Rellenar'}
                </Button>
              )}
              <Button onClick={() => onSummarize(section.id)} variant="outline" size="sm" disabled={isTranscribing || isSummarizing || !section.content}>
                {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                Resumir Sección
              </Button>
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
              {(isTranscribing || isSummarizing) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin h-4 w-4" />
                  {isTranscribing ? 'Transcribiendo y rellenando...' : 'Resumiendo...'}
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <Textarea
              value={section.content}
              onChange={(e) => onContentChange(section.id, e.target.value)}
              placeholder={isEditable ? "Define el contenido de la plantilla para esta sección" : "Haga clic en 'Grabar' para transcribir o escriba aquí..."}
              rows={12}
              className="pr-12 text-base"
              disabled={isTranscribing || isSummarizing}
            />
            <Button onClick={handleCopy} variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground" disabled={!section.content}>
              <span className="sr-only">Copiar al portapapeles</span>
              {isCopied ? <Check className="h-5 w-5 text-green-600" /> : <Clipboard className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
