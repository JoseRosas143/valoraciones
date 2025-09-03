'use server';

/**
 * @fileOverview A dynamic form transcription AI agent.
 * This flow takes an audio file and a list of sections, and generates a JSON object
 * where the keys are the section IDs and the values are the transcribed content for those sections.
 * This allows for flexible, user-defined form structures.
 *
 * - transcribeDynamicForm - A function that handles the dynamic transcription process.
 */

import {ai} from '@/ai/genkit';
import {
  TranscribeDynamicFormInput,
  TranscribeDynamicFormInputSchema,
  TranscribeDynamicFormOutput,
  TranscribeDynamicFormOutputSchema,
} from '@/types/dynamic-form';

export async function transcribeDynamicForm(
  input: TranscribeDynamicFormInput
): Promise<TranscribeDynamicFormOutput> {
  return transcribeDynamicFormFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transcribeDynamicFormPrompt',
  input: {schema: TranscribeDynamicFormInputSchema},
  output: {
    // Note: We don't specify a fixed output schema here because it's dynamic.
    // We will guide the model using the prompt itself.
    // The actual enforcement happens in the flow by parsing the output.
  },
  prompt: `Eres un experto en transcripción y estructuración de dictado. Tu tarea principal es analizar un audio y rellenar una estructura JSON basada en las secciones proporcionadas.

Instrucción General de Rol (si se proporciona): {{#if generalAiPrompt}}{{generalAiPrompt}}{{else}}Actúa como un asistente general de dictado.{{/if}}

Instrucciones de Proceso:
1.  **Transcripción Completa**: Primero, transcribe el audio completo y sin procesar en el campo 'originalTranscription' de tu objeto de salida.
2.  **Dictado Inteligente**: Tu función es transcribir la conversación y organizarla en las secciones proporcionadas. Sé flexible: captura la información relevante para cada sección.
3.  **No Inventar**: Si un campo o sección no se menciona en el audio, su valor en el JSON debe ser una cadena vacía.
4.  **Prioridad a Instrucciones Específicas**: El usuario puede proveer instrucciones específicas ('aiPrompt') para cada sección. ¡Estas instrucciones tienen la máxima prioridad! Síguelas al pie de la letra.
5.  **Formato de Salida**: Tu respuesta DEBE ser un único objeto JSON. Las claves de este objeto deben ser EXACTAMENTE los 'id' de las secciones que se enumeran a continuación. El valor de cada clave debe ser el texto transcrito para esa sección. También debe haber una clave llamada 'originalTranscription' con la transcripción completa.

Audio para transcribir: {{media url=audioDataUri}}

Secciones a completar (usa los 'id' como claves en tu JSON de salida):
{{#each sections}}
- Sección ID: {{id}}
  - Título: {{title}}
  - Instrucción Específica (aiPrompt): {{#if aiPrompt}}{{aiPrompt}}{{else}}Extraer información relevante del audio correspondiente a este título.{{/if}}
{{/each}}
`,
});

const transcribeDynamicFormFlow = ai.defineFlow(
  {
    name: 'transcribeDynamicFormFlow',
    inputSchema: TranscribeDynamicFormInputSchema,
    outputSchema: TranscribeDynamicFormOutputSchema,
  },
  async input => {
    // Generate the response, which we expect to be a JSON string
    const {output} = await prompt(input);
    
    // The output from the LLM is a string, so we need to parse it into a JSON object.
    // It's important to handle potential parsing errors.
    try {
      // The model might return the JSON string inside a markdown code block.
      const jsonString = output!.replace(/```json\n|```/g, '').trim();
      const parsedOutput = JSON.parse(jsonString);
      return parsedOutput;
    } catch (error) {
      console.error("Failed to parse JSON from LLM output:", error);
      // Return an empty object or handle the error as appropriate
      return { originalTranscription: 'Error al procesar la respuesta de la IA.' };
    }
  }
);
