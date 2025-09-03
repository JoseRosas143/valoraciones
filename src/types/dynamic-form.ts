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
export const TranscribeDynamicFormOutputSchema = z.object({
    originalTranscription: z.string().optional().describe('The full, raw, unprocessed transcription of the entire audio.'),
}).catchall(z.any());

export type TranscribeDynamicFormOutput = z.infer<
  typeof TranscribeDynamicFormOutputSchema
>;
