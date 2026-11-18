import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  ...['profesor', 'profesor/dashboard', 'estudiante', 'estudiante/dashboard', 'biblioteca', 'tareas', 'foro', 'chatbot', 'configuracion'].map((path): ServerRoute => ({ path, renderMode: RenderMode.Client })),
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
