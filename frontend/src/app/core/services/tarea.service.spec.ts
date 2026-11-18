import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TareaService } from './tarea.service';
import { AcademicSyncService } from './academic-sync.service';
import { AcademicSnapshot } from '../models/academic.model';

describe('TareaService: confirmación del servidor', () => {
  const empty: AcademicSnapshot = { tareas: [], books: [], posts: [], exams: [], messages: [], notifications: [], students: [] };
  let service: TareaService;
  let sync: { snapshot: ReturnType<typeof signal<AcademicSnapshot | null>>; commit: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    sync = { snapshot: signal<AcademicSnapshot | null>(null), commit: vi.fn() };
    TestBed.configureTestingModule({ providers: [TareaService, { provide: AcademicSyncService, useValue: sync }] });
    service = TestBed.inject(TareaService);
  });
  it('no usa datos locales ni tareas ficticias antes de recibir la API', () => {
    localStorage.setItem('disceria_academic_tareas', JSON.stringify([{ id: 'privado-anterior' }]));
    expect(service.tareas()).toEqual([]);
    localStorage.removeItem('disceria_academic_tareas');
  });
  it('conserva los datos si el servidor rechaza un borrador', async () => {
    sync.commit.mockRejectedValue(new Error('Conflicto de revisión'));
    await expect(service.saveDraft({ tareaId: 'task', content: 'Avance', revision: 2 })).rejects.toThrow('Conflicto');
    expect(service.tareas()).toEqual([]);
  });
  it('distingue guardar borrador de entregar y env?a la revisión', async () => {
    sync.commit.mockResolvedValue(empty);
    const draft = { tareaId: 'task', content: 'Avance', revision: 2 };
    await service.saveDraft(draft);
    expect(sync.commit).toHaveBeenCalledWith('tarea.draft', draft);
    expect(sync.commit).not.toHaveBeenCalledWith('tarea.submit', expect.anything());
  });
});
