// This is a server-side function, mark it as such.
'use server';

/**
 * @fileOverview A medical interview transcription AI agent.
 *
 * - transcribeMedicalInterview - A function that handles the medical interview transcription process.
 * - TranscribeMedicalInterviewInput - The input type for the transcribeMedicalInterview function.
 * - TranscribeMedicalInterviewOutput - The return type for the transcribeMedicalInterview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeMedicalInterviewInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio recording of the medical interview, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeMedicalInterviewInput = z.infer<typeof TranscribeMedicalInterviewInputSchema>;

const TranscribeMedicalInterviewOutputSchema = z.object({
  transcription: z
    .string()
    .describe('The transcription of the medical interview, focusing on relevant medical data.'),
});
export type TranscribeMedicalInterviewOutput = z.infer<typeof TranscribeMedicalInterviewOutputSchema>;

export async function transcribeMedicalInterview(
  input: TranscribeMedicalInterviewInput
): Promise<TranscribeMedicalInterviewOutput> {
  return transcribeMedicalInterviewFlow(input);
}

const transcribeMedicalInterviewPrompt = ai.definePrompt({
  name: 'transcribeMedicalInterviewPrompt',
  input: {schema: TranscribeMedicalInterviewInputSchema},
  output: {schema: TranscribeMedicalInterviewOutputSchema},
  prompt: `You are an AI assistant specialized in transcribing medical interviews.

  You will receive an audio recording of a medical interview and your task is to transcribe it.
  Focus on capturing relevant medical information, such as symptoms, medical history, examination findings, and treatment plans.
  Ignore any colloquial speech, background noise, and irrelevant details.

  Audio: {{media url=audioDataUri}}
  `,
});

const transcribeMedicalInterviewFlow = ai.defineFlow(
  {
    name: 'transcribeMedicalInterviewFlow',
    inputSchema: TranscribeMedicalInterviewInputSchema,
    outputSchema: TranscribeMedicalInterviewOutputSchema,
  },
  async input => {
    const {output} = await transcribeMedicalInterviewPrompt(input);
    return output!;
  }
);
