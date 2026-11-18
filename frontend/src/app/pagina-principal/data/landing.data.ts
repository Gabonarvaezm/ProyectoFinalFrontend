import { Course, Testimonial } from '../models/landing.model';

export const FEATURED_COURSES: readonly Course[] = [
  {
    id: 'resource-1',
    category: 'Ciencia y Tecnología',
    rating: 4.9,
    title: 'Guía de Programación y Pensamiento Computacional',
    classesCount: 24,
    studentsCount: 420,
    price: 'Acceso Libre',
    instructorName: 'Red Docente Pública',
    instructorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    image:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'resource-2',
    category: 'Matemáticas y Lógica',
    rating: 5.0,
    title: 'Fundamentos de Cálculo y Álgebra para Bachillerato',
    classesCount: 18,
    studentsCount: 650,
    price: 'Acceso Libre',
    instructorName: 'Comité Pedagógico',
    instructorAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    image:
      'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'resource-3',
    category: 'Lenguaje y Humanidades',
    rating: 4.8,
    title: 'Comprensión Lectora e Investigación Académica',
    classesCount: 16,
    studentsCount: 510,
    price: 'Acceso Libre',
    instructorName: 'Semillero Institucional',
    instructorAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    image:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
  },
];

export const TESTIMONIALS_DATA: readonly Testimonial[] = [
  {
    id: 'test-1',
    name: 'Lic. Alexis Rodríguez',
    role: 'Docente de Secundaria Pública',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    stars: 5,
    text: 'El chatbot con IA integrado a la biblioteca virtual me ha facilitado encontrar recursos académicos verificados y diseñar talleres interactivos para mis estudiantes.',
  },
  {
    id: 'test-2',
    name: 'Emily Chen',
    role: 'Estudiante Universitaria Pública',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    stars: 5,
    text: 'Tener acceso libre a libros especializados y poder consultar dudas directamente con el chatbot de IA ha sido una herramienta invaluable para mis trabajos de grado.',
  },
  {
    id: 'test-3',
    name: 'Prof. James Johnson',
    role: 'Coordinador Académico Institucional',
    avatar:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80',
    stars: 5,
    text: 'DiscerIA promueve la equidad educativa en nuestras instituciones públicas, combinando bibliografía de libre acceso con asistencia inteligente y personalizada 24/7.',
  },
];

