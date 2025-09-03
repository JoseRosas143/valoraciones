'use server';

/**
 * @fileOverview A dynamic form transcription AI agent.
 * This flow takes an audio file and a list of sections, and generates a JSON object
 * where the keys are the section IDs and the values are the transcribed content for those sections.
 * This allows for flexible, user-defined form structures.
 *
 * - transcribeDynamicForm - A function that handles the dynamic transcription process.
 * - TranscribeDynamicFormInput - The input type for the function.
 * - TranscribeDynamicFormOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SectionInstructionSchema = z.object({
  id: z.string().describe('The unique identifier for the section, to be used as a key in the output object.'),
  title: z.string().describe('The display title of the section.'),
  aiPrompt: z.string().optional().describe('Custom instruction for how to handle this section.'),
});

export const TranscribeDynamicFormInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio recording of the interview, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  generalAiPrompt: z.string().optional().describe('General instruction for the AI role for the entire form.'),
  sections: z.array(SectionInstructionSchema).describe('Instructions for each section to be filled.'),
});
export type TranscribeDynamicFormInput = z.infer<
  typeof TranscribeDynamicFormInputSchema
>;

// The output is a dynamic object where keys are the section IDs from the input.
export const TranscribeDynamicFormOutputSchema = z.record(z.string(), z.any());
export type TranscribeDynamicFormOutput = z.infer<
  typeof TranscribeDynamicFormOutputSchema
>;

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
  },
  prompt: `Eres un experto en transcripción y estructuración de dictado. Tu tarea principal es analizar un audio y rellenar una estructura JSON basada en las secciones proporcionadas.

Instrucción General de Rol (si se proporciona): {{#if generalAiPrompt}}{{generalAiPrompt}}{{else}}Actúa como un asistente general de dictado.{{/if}}

Instrucciones de Proceso:
1.  **Dictado Inteligente**: Tu función es transcribir la conversación y organizarla en las secciones proporcionadas. Sé flexible: captura la información relevante para cada sección.
2.  **No Inventar**: Si un campo o sección no se menciona en el audio, su valor en el JSON debe ser una cadena vacía.
3.  **Prioridad a Instrucciones Específicas**: El usuario puede proveer instrucciones específicas ('aiPrompt') para cada sección. ¡Estas instrucciones tienen la máxima prioridad! Síguelas al pie de la letra.
4.  **Formato de Salida**: Tu respuesta DEBE ser un único objeto JSON. Las claves de este objeto deben ser EXACTAMENTE los 'id' de las secciones que se enumeran a continuación. El valor de cada clave debe ser el texto transcrito para esa sección.

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
      return {};
    }
  }
);
