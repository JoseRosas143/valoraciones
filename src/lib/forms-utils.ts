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
        aiPrompt: 'Extraer la información del encabezado del hospital. Sé conciso y extrae solo los datos solicitados.'
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
        aiPrompt: 'Extrae los datos demográficos y de diagnóstico del paciente de manera estructurada.'
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
        aiPrompt: 'Detalla los antecedentes médicos de los familiares directos del paciente.'
    },
    {
        id: 'antecedentesPerinatales',
        title: 'Antecedentes Perinatales',
        content: `Prenatales:

Natales:

Desarrollo Psicomotor: 
Tamiz Neonatal:
`,
        aiPrompt: 'Describe los eventos médicos ocurridos antes, durante y después del nacimiento.'
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
        aiPrompt: 'Resume el estilo de vida, entorno e historial de vacunación del paciente.'
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
        aiPrompt: 'Enumera todas las condiciones médicas previas, cirugías, alergias y medicamentos actuales del paciente.'
    },
    {
        id: 'padecimientoActual',
        title: 'Padecimiento Actual',
        content: `Descripción del padecimiento: `,
        aiPrompt: 'Describe en detalle la razón principal de la consulta o ingreso hospitalario actual.'
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
        aiPrompt: 'Registra los signos vitales y mediciones corporales del paciente.'
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
        aiPrompt: 'Realiza un examen físico detallado por sistemas, desde la cabeza hasta las extremidades.'
    },
    {
        id: 'laboratoriosEstudios',
        title: 'Laboratorios y Estudios',
        content: `Biometría Hemática: 
Tiempos de Coagulación: 
Otros valores hematológicos: 
Estudios de Gabinete: `,
        aiPrompt: 'Reporta los resultados de los análisis de sangre, pruebas de coagulación y estudios de imagen relevantes.'
    },
    {
        id: 'valoracionOtrosServicios',
        title: 'Valoración por Otros Servicios',
        content: `Resumen de las valoraciones de otras especialidades: `,
        aiPrompt: 'Resume los hallazgos y recomendaciones de otros especialistas que han evaluado al paciente.'
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
        aiPrompt: 'Detalla el plan de manejo médico, clasifica el riesgo anestésico y calcula los volúmenes sanguíneos.'
    },
    {
      id: 'planAnestesico',
      title: 'Plan Anestésico',
      content: 'Plan Anestésico: ',
      aiPrompt: 'Describe la estrategia anestésica completa, incluyendo técnicas, fármacos y monitoreo.'
    },
    {
      id: 'indicacionesAnestesicas',
      title: 'Indicaciones Anestésicas',
      content: 'Indicaciones Anestésicas: ',
      aiPrompt: 'Enumera las órdenes médicas específicas para el periodo perioperatorio.'
    },
    {
      id: 'comentarioBibliografico',
      title: 'Comentario Bibliográfico',
      content: 'Comentario Bibliográfico: ',
      aiPrompt: 'Añade cualquier referencia bibliográfica o comentario académico relevante para el caso.'
    }
];

export const defaultTemplates: MedicalForm = {
    id: 'default',
    name: 'Valoración Preanestésica',
    sections: initialSections,
    isTemplate: true,
    generalAiPrompt: 'Eres un asistente médico experto en valoraciones preanestésicas. Tu tono debe ser formal y clínico. Extrae la información relevante del audio para cada sección, siguiendo las indicaciones específicas si se proporcionan.'
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
    generalAiPrompt: 'Eres un asistente de dictado para consultas. Transcribe la conversación de la manera más fiel posible, estructurando la información según las secciones provistas.'
};


export const getInitialForm = (template: MedicalForm = defaultTemplates): MedicalForm => {
    const newSections = template.sections.map(section => ({
        ...section,
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
        generalAiPrompt: template.generalAiPrompt || 'Eres un asistente de dictado experto. Tu tarea es transcribir y estructurar la información de manera clara y precisa según las secciones provistas.',
    }
}
