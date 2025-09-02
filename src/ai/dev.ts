import { config } from 'dotenv';
config();

import '@/ai/flows/transcribe-medical-interview.ts';
import '@/ai/flows/summarize-medical-section.ts';