'use server';

/**
 * @fileOverview Summarizes a specific medical section from a transcribed interview.
 *
 * - summarizeMedicalSection - A function that summarizes a given section of a medical interview.
 * - SummarizeMedicalSectionInput - The input type for the summarizeMedicalSection function.
 * - SummarizeMedicalSectionOutput - The return type for the summarizeMedicalSection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeMedicalSectionInputSchema = z.object({
  sectionText: z
    .string()
    .describe('The transcribed text of a specific medical section.'),
});
export type SummarizeMedicalSectionInput = z.infer<
  typeof SummarizeMedicalSectionInputSchema
>;

const SummarizeMedicalSectionOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the medical section.'),
});
export type SummarizeMedicalSectionOutput = z.infer<
  typeof SummarizeMedicalSectionOutputSchema
>;

export async function summarizeMedicalSection(
  input: SummarizeMedicalSectionInput
): Promise<SummarizeMedicalSectionOutput> {
  return summarizeMedicalSectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeMedicalSectionPrompt',
  input: {schema: SummarizeMedicalSectionInputSchema},
  output: {schema: SummarizeMedicalSectionOutputSchema},
  prompt: `Eres un asistente de IA especializado en resumir entrevistas y textos médicos.
  
  Por favor, proporciona un resumen conciso de la siguiente sección médica, enfocándote en la información médica relevante e ignorando cualquier contenido irrelevante o conversacional.

  IMPORTANTE: Tu respuesta debe ser exclusivamente en español.

  Texto de la sección:
  {{sectionText}}`,
});

const summarizeMedicalSectionFlow = ai.defineFlow(
  {
    name: 'summarizeMedicalSectionFlow',
    inputSchema: SummarizeMedicalSectionInputSchema,
    outputSchema: SummarizeMedicalSectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
