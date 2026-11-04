import {
  CommunityAiSuggestion,
  ForumPost,
  RelatedTopic,
} from '../models/foro.model';

export const INITIAL_AI_SUGGESTION: CommunityAiSuggestion = {
  postId: 'post-1',
  postTitle: '¿Cómo resuelvo integrales por partes?',
  summary:
    'For the "Integrales por partes" question, consider recommending the LIATE rule (Logarithmic, Inverse trig, Algebraic, Trig, Exponential) as a mnemonic for choosing \'u\'.',
  draftResponse:
    'Para resolver integrales por partes de forma sistemática utiliza la regla mnemotécnica LIATE:\n1. Logarítmicas (L)\n2. Inversas trigonométricas (I)\n3. Algebraicas (A)\n4. Trigonométricas (T)\n5. Exponenciales (E)\n\nElige como "u" la función que aparezca primero en esta lista y como "dv" el resto. Luego aplica la fórmula: ∫u dv = u*v - ∫v du.',
  referenceMnemonic: 'LIATE',
};

export const INITIAL_RELATED_TOPICS: readonly RelatedTopic[] = [
  {
    id: 'rel-1',
    title: 'Técnicas de Integración Avanzadas',
    subject: 'Matemáticas',
    activeThreads: 34,
  },
  {
    id: 'rel-2',
    title: 'Renacimiento vs Barroco',
    subject: 'Historia',
    activeThreads: 12,
  },
  {
    id: 'rel-3',
    title: 'Regulación del Ciclo Celular y Mitosis',
    subject: 'Ciencias',
    activeThreads: 19,
  },
];

export const FORUM_ETIQUETTE_RULES: readonly string[] = [
  'Always cite your sources when providing academic answers.',
  'Check if a similar question has been asked before posting.',
  'Be respectful and constructive in your critiques.',
];

export const INITIAL_FORUM_POSTS: readonly ForumPost[] = [
  {
    id: 'post-1',
    title: '¿Cómo resuelvo integrales por partes?',
    content:
      'Tengo dificultades eligiendo adecuadamente qué término asignar como "u" y cuál como "dv" cuando combino funciones algebraicas con funciones trigonométricas o exponenciales. ¿Existe alguna regla o recomendación estándar para no iterar indefinidamente?',
    author: {
      id: 'user-ana',
      name: 'Ana Silva',
      role: 'student',
      institution: 'Facultad de Ciencias Básicas',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      initials: 'AS',
    },
    subject: 'Matemáticas',
    createdAt: '2 hours ago',
    isTeacherVerified: true,
    isUnanswered: false,
    helpfulCount: 24,
    userHasVotedHelpful: false,
    viewsCount: 156,
    repliesCount: 12,
    academicReference:
      'Stewart, J. (2016). Cálculo de una variable: Trascendentes tempranas (8va ed.). Cengage Learning.',
    replies: [
      {
        id: 'rep-1',
        postId: 'post-1',
        author: {
          id: 'prof-rodriguez',
          name: 'Prof. Alexis Rodríguez',
          role: 'professor',
          roleTitle: 'Catedrático de Matemáticas',
          institution: 'Universidad Nacional Pública',
          avatar:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
          initials: 'AR',
        },
        content:
          'Excelente consulta, Ana. La regla estándar en el análisis de cálculo es **LIATE** (Logarítmicas, Inversas trigonométricas, Algebraicas, Trigonométricas, Exponenciales). La que aparezca más arriba en el acrónimo debe ser seleccionada como "u", facilitando que al derivarla se simplifique la expresión restante.',
        createdAt: '1 hour ago',
        helpfulCount: 18,
        userHasVotedHelpful: false,
        isTeacherVerified: true,
        academicReference:
          'Larson, R., & Edwards, B. H. (2018). Cálculo (10ma ed.). McGraw-Hill.',
      },
    ],
  },
  {
    id: 'post-2',
    title: 'Duda sobre el Barroco y sus influencias arquitectónicas',
    content:
      'Al analizar la transición del Renacimiento tardío al Barroco, ¿cuáles fueron los factores teológicos y políticos determinantes que promovieron el uso del claroscuro y las plantas elípticas en los templos del siglo XVII?',
    author: {
      id: 'user-carlos-m',
      name: 'Carlos Mendoza',
      role: 'student',
      institution: 'Escuela de Humanidades y Artes',
      avatar:
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80',
      initials: 'CM',
    },
    subject: 'Historia',
    createdAt: '5 hours ago',
    isTeacherVerified: false,
    isUnanswered: false,
    helpfulCount: 8,
    userHasVotedHelpful: false,
    viewsCount: 42,
    repliesCount: 5,
    academicReference: 'Gombrich, E. H. (1995). La historia del arte. Phaidon Press.',
    replies: [
      {
        id: 'rep-2',
        postId: 'post-2',
        author: {
          id: 'prof-marta',
          name: 'Dra. Marta Valenzuela',
          role: 'professor',
          institution: 'Instituto de Investigaciones Históricas',
          avatar:
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
          initials: 'MV',
        },
        content:
          'El Concilio de Trento (Contrarreforma) fue el catalizador principal: la Iglesia Católica buscó emocionar e impresionar a los fieles mediante la teatralidad y el dinamismo lumínico frente a la sobriedad protestante.',
        createdAt: '3 hours ago',
        helpfulCount: 6,
        userHasVotedHelpful: false,
        isTeacherVerified: false,
        academicReference: 'Bazin, G. (1968). El Barroco. Destino.',
      },
    ],
  },
  {
    id: 'post-3',
    title: 'Impacto de la Mitosis en la salud celular a largo plazo',
    content:
      '¿Cómo influye el acortamiento de los telómeros durante sucesivas divisiones mitóticas en la senescencia celular y qué mecanismos intrínsecos activan la apoptosis antes de que ocurra una transformación oncogénica?',
    author: {
      id: 'user-elena',
      name: 'Elena Rojas',
      role: 'student',
      institution: 'Facultad de Ciencias de la Salud',
      avatar: '',
      initials: 'ER',
    },
    subject: 'Ciencias',
    createdAt: '1 day ago',
    isTeacherVerified: false,
    isUnanswered: true,
    helpfulCount: 3,
    userHasVotedHelpful: false,
    viewsCount: 89,
    repliesCount: 2,
    academicReference:
      'Alberts, B., et al. (2015). Molecular Biology of the Cell (6th ed.). Garland Science.',
    replies: [],
  },
];

