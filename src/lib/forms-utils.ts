import { MedicalForm, MedicalSection } from '@/types/medical-form';
import { nanoid } from 'nanoid';

export const initialSections: MedicalSection[] = [
    {
        id: 'hospitalInfo',
        title: 'Encabezado de la Institución y Servicio',
        content: `Nombre del Hospital: 
Servicio Médico: 
Valorado en: 
Cama: 
Fecha: `,
    },
    {
        id: 'datosPaciente',
        title: 'Datos del Paciente',
        content: `Nombre: 
NSS: 
Edad: 
Sexo: 
Fecha de Ingreso: 
Fecha de nacimiento:
Diagnóstico: 
Procedimiento: `,
    },
    {
        id: 'antecedentesHeredofamiliares',
        title: 'Antecedentes Heredofamiliares',
        content: `Madre:
  Edad: 
  Lugar de origen y residencia: 
  Escolaridad: 
  Estado civil: 
  Ocupación: 
  Enfermedades crónico-degenerativas: 
  Hemotipo: 
  Toxicomanías: 
  Medicamentos: 
Padre:
  Edad: 
  Lugar de origen y residencia: 
  Escolaridad: 
  Estado civil: 
  Ocupación: 
  Enfermedades crónico-degenerativas: 
  Hemotipo: 
  Toxicomanías: 
  Medicamentos: 
Hermanos: 
Rama Materna: 
Rama Paterna: 
Consanguinidad: `,
    },
    {
        id: 'antecedentesPerinatales',
        title: 'Antecedentes Perinatales',
        content: `Prenatales:

Natales:

Desarrollo Psicomotor: 
Tamiz Neonatal:
`,
    },
    {
        id: 'antecedentesPersonalesNoPatologicos',
        title: 'Antecedentes Personales No Patológicos',
        content: `Vivienda: 
Higiene: 
Alimentación: 
Inmunizaciones: 
Cuidador Principal: 
Hemotipo: 
Escolaridad: `,
    },
    {
        id: 'antecedentesPersonalesPatologicos',
        title: 'Antecedentes Personales Patológicos',
        content: `Enfermedades crónico-degenerativas: 
Alergias: 
Alergia al látex: 
Convulsiones: 
Asma/broncoespasmos: 
Enfermedades exantemáticas: 
Quirúrgicos: 
Traumatismos: 
Intoxicaciones: 
Transfusiones: 
Hospitalizaciones previas: 
IVRS (Infecciones de Vías Respiratorias Superiores): 
Medicamentos actuales: `,
    },
    {
        id: 'padecimientoActual',
        title: 'Padecimiento Actual',
        content: `Descripción del padecimiento: `,
    },
    {
        id: 'somatometria',
        title: 'Somatometría',
        content: `Talla: 
Peso real: 
Tensión arterial: 
Frecuencia cardiaca: 
Frecuencia respiratoria: 
Temperatura: 
Saturación O2: 
Superficie corporal: `,
    },
    {
        id: 'exploracionFisica',
        title: 'Exploración Física',
        content: `Descripción general del paciente: 
Piel y tegumentos: 
Cráneo: 
Boca/faringe: 
Vía aérea: 
Cuello: 
Tórax: 
Abdomen: 
Genitales: 
Extremidades: 
Columna vertebral: 
Accesos vasculares: `,
    },
    {
        id: 'laboratoriosEstudios',
        title: 'Laboratorios y Estudios',
        content: `Biometría Hemática: 
Tiempos de Coagulación: 
Otros valores hematológicos: 
Estudios de Gabinete: `,
    },
    {
        id: 'valoracionOtrosServicios',
        title: 'Valoración por Otros Servicios',
        content: `Resumen de las valoraciones de otras especialidades: `,
    },
    {
        id: 'planComentariosAdicionales',
        title: 'Plan y Comentarios Adicionales',
        content: `Espacio Libre para Información Adicional: 
Manejo Médico de su Servicio: 
Riesgo Anestésico Quirúrgico:
  ASA: 
  RAQ: 
  CEPOD: 
  IPID: 
  NARCO SS: 
Volumen Sanguíneo Circulante: 
Sangrado Permisible: `,
    },
    {
      id: 'planAnestesico',
      title: 'Plan Anestésico',
      content: 'Plan Anestésico: ',
    },
    {
      id: 'indicacionesAnestesicas',
      title: 'Indicaciones Anestésicas',
      content: 'Indicaciones Anestésicas: ',
    },
    {
      id: 'comentarioBibliografico',
      title: 'Comentario Bibliográfico',
      content: 'Comentario Bibliográfico: ',
    }
];

export const defaultTemplates: MedicalForm = {
    id: 'default',
    name: 'Valoración Preanestésica',
    sections: initialSections,
    isTemplate: true,
    generalAiPrompt: 'Eres un asistente médico experto en valoraciones preanestésicas. Tu tono debe ser formal y clínico. Extrae la información relevante del audio para cada sección.'
};

export const noteTemplate: MedicalForm = {
    id: 'note',
    name: 'Nota de Consulta',
    sections: [
        {
            id: 'consulta',
            title: 'Consulta',
            content: '',
            aiPrompt: 'Realizar una transcripción lo más fiel posible de la interacción durante la consulta. Enfocarse en capturar el diálogo y los detalles médicos relevantes de manera textual.',
        }
    ],
    isTemplate: true,
    generalAiPrompt: 'Eres un asistente de dictado para consultas. Transcribe la conversación de la manera más fiel posible.'
};


export const getInitialForm = (template: MedicalForm = defaultTemplates): MedicalForm => {
    // Make sure to create new IDs for sections when creating a form from a template
    const newSections = template.sections.map(section => ({
        ...section,
        id: section.id, // Keep original ID for mapping, but a real ID will be given by nanoid in the component
        content: section.content || '',
        summary: '',
        aiPrompt: section.aiPrompt || '',
    }));

    return {
        ...template,
        id: nanoid(),
        name: `Nuevo Formulario - ${new Date().toLocaleDateString()}`,
        isTemplate: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        templateId: template.id,
        sections: newSections,
        generalAiPrompt: template.generalAiPrompt,
    }
}
