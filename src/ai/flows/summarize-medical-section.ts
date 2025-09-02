// SummarizeMedicalSection.ts
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
  prompt: `You are an AI assistant that specializes in summarizing medical interviews.

  Please provide a concise summary of the following medical section, focusing on relevant medical information and ignoring any irrelevant or conversational content:

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
