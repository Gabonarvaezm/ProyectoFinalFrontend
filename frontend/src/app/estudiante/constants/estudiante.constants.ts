export const SUBJECT_CATEGORY_MAP: Readonly<Record<string, string>> = {
  mat: 'matematicas',
  cie: 'ciencias',
  his: 'humanidades',
  len: 'lenguaje',
};

export interface AiKnowledgeRule {
  readonly keywords: readonly string[];
  readonly response: string;
}

export const AI_KNOWLEDGE_BASE: readonly AiKnowledgeRule[] = [
  {
    keywords: ['resumen', 'biología', 'mitosis'],
    response:
      'Resumen de Mitosis: Consta de 4 etapas clave (Profase, Metafase, Anafase y Telofase), asegurando que cada célula hija reciba una dotación cromosómica completa (2n). La Meiosis, en cambio, reduce los cromosomas a la mitad (n) para formar gametos.',
  },
  {
    keywords: ['examen', 'preguntas'],
    response:
      'Pregunta 1: ¿En qué fase de la mitosis se alinean los cromosomas en el ecuador celular?\nA) Anafase\nB) Metafase\nC) Telofase\nResponde para validar tu respuesta.',
  },
  {
    keywords: ['profase', 'diferencia'],
    response:
      'En la Profase la cromatina se condensa en cromosomas visibles y la membrana nuclear se desintegra. En la Metafase los cromosomas ya están alineados en la placa ecuatorial listos para separarse.',
  },
  {
    keywords: ['integral', 'partes', 'matemática'],
    response:
      'La fórmula de integración por partes es: ∫ u dv = u·v - ∫ v du. Elige "u" usando el método ILATE (Inversas, Logarítmicas, Algebraicas, Trigonométricas, Exponenciales).',
  },
];

export const AI_DEFAULT_FALLBACK_REPLY =
  'He analizado tu consulta con base en la biblioteca académica de DiscerIA.';

