import { Tarea } from '../models/tarea.model';

export const INITIAL_TAREAS: Tarea[] = [
  {
    id: 'tar-1',
    title: 'Reporte de Práctica: Mitosis y Meiosis en Tejidos Vegetales',
    description:
      'Elaborar un informe científico detallado con observaciones microscópicas de las fases de división celular en ápices de cebolla. Incluir micrografías rotuladas y discusión sobre anomalías cromosómicas.',
    subject: 'Ciencias',
    dueDate: '2026-11-20',
    maxScore: 100,
    priority: 'alta',
    assignedBy: 'Prof. Carlos Mendoza',
    assignedDate: '2026-11-08',
    status: 'pendiente',
    attachmentName: 'guia_practica_mitosis.pdf',
    submissionsCount: 18,
  },
  {
    id: 'tar-2',
    title: 'Resolución de Problemas: Integración por Partes (Método LIATE)',
    description:
      'Resolver los 8 ejercicios propuestos en la guía de cálculo integral aplicando la regla mnemotécnica LIATE. Detallar el procedimiento paso a paso para la selección de u y dv.',
    subject: 'Matemáticas',
    dueDate: '2026-11-18',
    maxScore: 100,
    priority: 'alta',
    assignedBy: 'Prof. Arturo Sotomayor',
    assignedDate: '2026-11-05',
    status: 'entregada',
    attachmentName: 'taller_integrales_avanzadas.pdf',
    submissionsCount: 24,
    mySubmission: {
      id: 'sub-1',
      tareaId: 'tar-2',
      studentId: 'student-alejandro',
      studentName: 'Alejandro Silva',
      submittedAt: '2026-11-10T14:30:00Z',
      content:
        'Adjunto el desarrollo completo de los 8 ejercicios de integración por partes con sus respectivas comprobaciones por derivación.',
      attachmentUrl: 'https://ejemplo.edu/archivos/solucion_integrales_silva.pdf',
      comments: 'Quedó una duda en el ejercicio 7 respecto a la integral cíclica de e^(2x)*sin(3x).',
    },
  },
  {
    id: 'tar-3',
    title: 'Ensayo Crítico: El Impacto Social de la Revolución Industrial',
    description:
      'Redactar un ensayo argumentativo de 1500 palabras analizando las transformaciones en la estructura laboral y la urbanización en Europa durante los siglos XVIII y XIX. Citar al menos 3 fuentes académicas.',
    subject: 'Historia',
    dueDate: '2026-11-12',
    maxScore: 100,
    priority: 'media',
    assignedBy: 'Prof. Laura Gómez',
    assignedDate: '2026-10-28',
    status: 'calificada',
    attachmentName: 'rubrica_ensayo_historico.pdf',
    submissionsCount: 30,
    mySubmission: {
      id: 'sub-2',
      tareaId: 'tar-3',
      studentId: 'student-alejandro',
      studentName: 'Alejandro Silva',
      submittedAt: '2026-11-07T18:00:00Z',
      content:
        'Ensayo completado: "De los telares al vapor: La metamorfosis del proletariado urbano en la Europa decimonónica". Fuentes: Hobsbawm, Thompson y Polanyi.',
      attachmentUrl: 'https://ejemplo.edu/archivos/ensayo_revolucion_industrial.pdf',
      grade: 95,
      feedback:
        'Excelente análisis historiográfico y pertinencia crítica. Gran manejo del aparato crítico y citas según normas APA 7ma edición.',
      gradedAt: '2026-11-09',
    },
  },
  {
    id: 'tar-4',
    title: 'Algoritmos de Búsqueda y Ordenamiento en Python',
    description:
      'Implementar y medir el tiempo de ejecución (análisis asintótico Big-O) de Quicksort, Mergesort y Binary Search sobre arreglos de datos aleatorios de 10,000 y 100,000 elementos.',
    subject: 'Tecnología',
    dueDate: '2026-11-25',
    maxScore: 100,
    priority: 'media',
    assignedBy: 'Ing. Sofía Valenzuela',
    assignedDate: '2026-11-09',
    status: 'pendiente',
    attachmentName: 'benchmark_python_template.py',
    submissionsCount: 12,
  },
  {
    id: 'tar-5',
    title: 'Análisis Sintáctico y Semántico de Textos del Siglo de Oro',
    description:
      'Realizar el árbol de análisis sintáctico de fragmentos seleccionados de "La vida es sueño" de Calderón de la Barca e identificar figuras retóricas barrocas.',
    subject: 'Lenguaje',
    dueDate: '2026-11-02',
    maxScore: 100,
    priority: 'baja',
    assignedBy: 'Prof. Gabriel Montes',
    assignedDate: '2026-10-20',
    status: 'vencida',
    attachmentName: 'fragmentos_barrocos.pdf',
    submissionsCount: 22,
  },
];

export const SUBJECTS_LIST: string[] = [
  'Todas las Materias',
  'Ciencias',
  'Matemáticas',
  'Historia',
  'Tecnología',
  'Lenguaje',
];

export const STATUS_LIST: { id: string; label: string }[] = [
  { id: 'todas', label: 'Todas las Tareas' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'entregada', label: 'Entregadas' },
  { id: 'calificada', label: 'Calificadas' },
  { id: 'vencida', label: 'Vencidas' },
];

