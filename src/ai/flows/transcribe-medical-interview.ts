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

const SectionInstructionSchema = z.object({
  id: z.string(),
  title: z.string(),
  aiPrompt: z.string().optional().describe('Custom instruction for how to handle this section.'),
});

const TranscribeMedicalInterviewInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio recording of the medical interview, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  sections: z.array(SectionInstructionSchema).optional().describe('Instructions for each section to be filled.'),
});
export type TranscribeMedicalInterviewInput = z.infer<
  typeof TranscribeMedicalInterviewInputSchema
>;

const HospitalInfoSchema = z.object({
  nombreHospital: z.string().optional(),
  servicioMedico: z.string().optional(),
  valoradoEn: z.string().optional(),
  cama: z.string().optional(),
  fecha: z.string().optional(),
});
const DatosPacienteSchema = z.object({
  nombre: z.string().optional(),
  nss: z.string().optional(),
  edad: z.string().optional(),
  sexo: z.string().optional(),
  fechaIngreso: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  diagnostico: z.string().optional(),
  procedimiento: z.string().optional(),
});
const MadrePadreSchema = z.object({
  edad: z.string().optional(),
  origenResidencia: z.string().optional(),
  escolaridad: z.string().optional(),
  estadoCivil: z.string().optional(),
  ocupacion: z.string().optional(),
  enfermedadesCronicasDegenerativas: z.string().optional(),
  hemotipo: z.string().optional(),
  toxicomanias: z.string().optional(),
  medicamentos: z.string().optional(),
});
const AntecedentesHeredofamiliaresSchema = z.object({
  madre: MadrePadreSchema.optional(),
  padre: MadrePadreSchema.optional(),
  hermanos: z.string().optional(),
  ramaMaterna: z.string().optional(),
  ramaPaterna: z.string().optional(),
  consanguinidad: z.string().optional(),
});
const PrenatalesSchema = z.object({
  numeroGesta: z.string().optional(),
  edadMaterna: z.string().optional(),
  controlPrenatal: z.string().optional(),
  ultrasonidos: z.string().optional(),
  ingestionSuplementos: z.string().optional(),
  vdrlVih: z.string().optional(),
  amenazasAbortoParto: z.string().optional(),
  patologiasGestacionales: z.string().optional(),
});
const NatalesSchema = z.object({
  tipoParto: z.string().optional(),
  peso: z.string().optional(),
  talla: z.string().optional(),
  apgar: z.string().optional(),
  complicaciones: z.string().optional(),
});
const PostnatalesSchema = z.object({
  complicaciones: z.string().optional(),
  tiempoEgreso: z.string().optional(),
});
const TamizNeonatalSchema = z.object({
  auditivo: z.string().optional(),
  cardiaco: z.string().optional(),
  metabolico: z.string().optional(),
});
const AntecedentesPerinatalesSchema = z.object({
  prenatales: PrenatalesSchema.optional(),
  natales: NatalesSchema.optional(),
  postnatales: PostnatalesSchema.optional(),
  desarrolloPsicomotor: z.string().optional(),
  tamizNeonatal: TamizNeonatalSchema.optional(),
});
const AntecedentesPersonalesNoPatologicosSchema = z.object({
  vivienda: z.string().optional(),
  higiene: z.string().optional(),
  alimentacion: z.string().optional(),
  inmunizaciones: z.string().optional(),
  cuidadorPrincipal: z.string().optional(),
  hemotipo: zstring().optional(),
  escolaridad: z.string().optional(),
});
const AntecedentesPersonalesPatologicosSchema = z.object({
  enfermedadesCronicasDegenerativas: z.string().optional(),
  alergias: z.string().optional(),
  alergiaLatex: z.string().optional(),
  convulsiones: z.string().optional(),
  asmaBroncoespasmos: z.string().optional(),
  enfermedadesExantematicas: z.string().optional(),
  quirurgicos: z.string().optional(),
  traumatismos: z.string().optional(),
  intoxicaciones: z.string().optional(),
  transfusiones: z.string().optional(),
  hospitalizacionesPrevias: z.string().optional(),
  ivrs: z.string().optional(),
  medicamentosActuales: z.string().optional(),
});
const PadecimientoActualSchema = z.object({
  descripcion: z.string().optional(),
});
const SomatometriaSchema = z.object({
  talla: z.string().optional(),
  pesoReal: z.string().optional(),
  tensionArterial: z.string().optional(),
  frecuenciaCardiaca: z.string().optional(),
  frecuenciaRespiratoria: z.string().optional(),
  temperatura: z.string().optional(),
  saturacionO2: z.string().optional(),
  superficieCorporal: z.string().optional(),
});
const ExploracionFisicaSchema = z.object({
  descripcionGeneral: z.string().optional(),
  pielTegumentos: z.string().optional(),
  craneo: z.string().optional(),
  bocaFaringe: z.string().optional(),
  viaAerea: z.string().optional(),
  cuello: z.string().optional(),
  torax: z.string().optional(),
  abdomen: z.string().optional(),
  genitales: z.string().optional(),
  extremidades: z.string().optional(),
columnaVertebral: z.string().optional(),
  accesosVasculares: z.string().optional(),
});
const LaboratoriosEstudiosSchema = z.object({
  biometriaHematica: z.string().optional(),
  tiemposCoagulacion: z.string().optional(),
  otrosValoresHematologicos: z.string().optional(),
  estudiosGabinete: z.string().optional(),
});
const ValoracionOtrosServiciosSchema = z.object({
  resumen: z.string().optional(),
});
const RiesgoAnestesicoQuirurgicoSchema = z.object({
  asa: z.string().optional(),
  raq: z.string().optional(),
  cepod: z.string().optional(),
  ipid: z.string().optional(),
  narcoSS: z.string().optional(),
});
const PlanComentariosAdicionalesSchema = z.object({
  espacioLibre: z.string().optional(),
  manejoMedicoServicio: z.string().optional(),
  riesgoAnestesicoQuirurgico: RiesgoAnestesicoQuirurgicoSchema.optional(),
  volumenSanguineoCirculante: z.string().optional(),
  sangradoPermisible: z.string().optional(),
});

const PlanAnestesicoSchema = z.object({
  planAnestesico: z.string().optional(),
});

const IndicacionesAnestesicasSchema = z.object({
  indicacionesAnestesicas: z.string().optional(),
});

const ComentarioBibliograficoSchema = z.object({
  comentarioBibliografico: z.string().optional(),
});

const ConsultaSchema = z.object({
    transcripcion: z.string().optional(),
});


const TranscribeMedicalInterviewOutputSchema = z.object({
  hospitalInfo: HospitalInfoSchema.optional().describe('Información del hospital y servicio.'),
  datosPaciente: DatosPacienteSchema.optional().describe('Datos de identificación del paciente.'),
  antecedentesHeredofamiliares: AntecedentesHeredofamiliaresSchema.optional().describe('Antecedentes médicos de la familia del paciente.'),
  antecedentesPerinatales: AntecedentesPerinatalesSchema.optional().describe('Información sobre el nacimiento y periodo perinatal.'),
  antecedentesPersonalesNoPatologicos: AntecedentesPersonalesNoPatologicosSchema.optional().describe('Estilo de vida y entorno del paciente.'),
  antecedentesPersonalesPatologicos: AntecedentesPersonalesPatologicosSchema.optional().describe('Historial de enfermedades y condiciones médicas del paciente.'),
  padecimientoActual: PadecimientoActualSchema.optional().describe('Descripción del motivo de la consulta actual.'),
  somatometria: SomatometriaSchema.optional().describe('Mediciones físicas del paciente.'),
  exploracionFisica: ExploracionFisicaSchema.optional().describe('Resultados del examen físico.'),
  laboratoriosEstudios: LaboratoriosEstudiosSchema.optional().describe('Resultados de pruebas de laboratorio e imagen.'),
  valoracionOtrosServicios: ValoracionOtrosServiciosSchema.optional().describe('Resumen de valoraciones por otras especialidades.'),
  planComentariosAdicionales: PlanComentariosAdicionalesSchema.optional().describe('Plan de tratamiento y comentarios adicionales.'),
  planAnestesico: PlanAnestesicoSchema.optional().describe('Plan anestésico detallado.'),
  indicacionesAnestesicas: IndicacionesAnestesicasSchema.optional().describe('Indicaciones anestésicas específicas.'),
  comentarioBibliografico: ComentarioBibliograficoSchema.optional().describe('Comentarios bibliográficos relevantes.'),
  consulta: ConsultaSchema.optional().describe('Transcripción de una consulta general.'),
});

export type TranscribeMedicalInterviewOutput = z.infer<
  typeof TranscribeMedicalInterviewOutputSchema
>;

export async function transcribeMedicalInterview(
  input: TranscribeMedicalInterviewInput
): Promise<TranscribeMedicalInterviewOutput> {
  return transcribeMedicalInterviewFlow(input);
}

const transcribeMedicalInterviewPrompt = ai.definePrompt({
  name: 'transcribeMedicalInterviewPrompt',
  input: {schema: TranscribeMedicalInterviewInputSchema},
  output: {schema: TranscribeMedicalInterviewOutputSchema},
  prompt: `Eres un asistente médico experto en valoración preanestésica y transcripción de dictado. Tu tarea principal es analizar un audio de un interrogatorio médico y extraer la información clínica para rellenar una estructura JSON.

Instrucciones Generales:
1.  **Dictado Inteligente**: Tu función es transcribir la conversación. Presta especial atención a la información relevante para cada sección del formulario según su título.
2.  **Flexibilidad**: Si bien debes enfocarte en lo médico, transcribe también información contextual que pueda ser relevante, incluso si no parece estrictamente clínica. El objetivo es una transcripción fiel pero organizada.
3.  **No Inventar**: Si un campo o sección no se menciona en el audio, déjalo vacío. No inventes información.
4.  **Instrucciones Específicas de Sección**: El usuario puede proveer instrucciones específicas para cada sección. ¡Síguelas al pie de la letra! Por ejemplo, si una sección pide "transcripción exacta", transcribe todo textualmente para esa sección. Si pide "solo datos médicos", filtra la conversación.
5.  **Frase Clave "agregar información extra"**: Si en el audio se menciona esta frase, todo el texto que siga debe ser transcrito y colocado en el campo "espacioLibre" de la sección "planComentariosAdicionales".

Audio para transcribir: {{media url=audioDataUri}}

Secciones a completar (sigue las instrucciones de 'aiPrompt' si se proporcionan):
{{#each sections}}
- Sección ID: {{id}}
- Título: {{title}}
- Instrucción (aiPrompt): {{#if aiPrompt}}{{aiPrompt}}{{else}}Extraer información relevante del audio correspondiente a este título.{{/if}}
{{/each}}
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
