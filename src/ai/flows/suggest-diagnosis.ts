'use server';

/**
 * @fileOverview Suggests a possible medical diagnosis based on a consultation transcript.
 *
 * - suggestDiagnosis - A function that suggests a diagnosis.
 * - SuggestDiagnosisInput - The input type for the suggestDiagnosis function.
 * - SuggestDiagnosisOutput - The return type for the suggestDiagnosis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDiagnosisInputSchema = z.object({
  consultationText: z
    .string()
    .describe('The transcribed text of a medical consultation.'),
});
export type SuggestDiagnosisInput = z.infer<
  typeof SuggestDiagnosisInputSchema
>;

const SuggestDiagnosisOutputSchema = z.object({
  diagnosis: z.string().describe('A possible diagnosis based on the consultation, including reasoning.'),
});
export type SuggestDiagnosisOutput = z.infer<
  typeof SuggestDiagnosisOutputSchema
>;

export async function suggestDiagnosis(
  input: SuggestDiagnosisInput
): Promise<SuggestDiagnosisOutput> {
  return suggestDiagnosisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDiagnosisPrompt',
  input: {schema: SuggestDiagnosisInputSchema},
  output: {schema: SuggestDiagnosisOutputSchema},
  prompt: `Eres un asistente médico experto. Basado en la siguiente transcripción de una consulta médica, proporciona un posible diagnóstico.
  
  Analiza los síntomas, historial y cualquier otra información relevante mencionada. Tu respuesta debe incluir el posible diagnóstico y una breve justificación basada en la evidencia del texto. No inventes información. Si la información es insuficiente, indícalo.

  Transcripción de la Consulta:
  {{{consultationText}}}
  `,
});

const suggestDiagnosisFlow = ai.defineFlow(
  {
    name: 'suggestDiagnosisFlow',
    inputSchema: SuggestDiagnosisInputSchema,
    outputSchema: SuggestDiagnosisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
