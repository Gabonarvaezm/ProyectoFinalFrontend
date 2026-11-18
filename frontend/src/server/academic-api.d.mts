import type { Router } from 'express';
export class AcademicStore {
  constructor(path?: string);
  close(): void;
}
export function createAcademicRouter(options?: { store?: AcademicStore }): Router;
