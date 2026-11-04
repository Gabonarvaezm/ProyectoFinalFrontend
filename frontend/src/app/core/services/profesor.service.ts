import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { STORAGE_KEYS } from '../models/auth.model';
import {
  CreateStudentDto,
  KpiMetric,
  RecentActivity,
  StudentProgress,
  StudentStatus,
} from '../../profesor/models/profesor.model';
import {
  INITIAL_ACTIVITIES_SEED,
  INITIAL_STUDENTS_SEED,
} from '../../profesor/data/profesor.data';

@Injectable({
  providedIn: 'root',
})
export class ProfesorService {
  private readonly platformId = inject(PLATFORM_ID);

  // ── Estado Reactivo Principal con Signals ─────────────────────────────────
  private readonly _students = signal<StudentProgress[]>([]);
  public readonly students = this._students.asReadonly();

  private readonly _recentActivities = signal<RecentActivity[]>([]);
  public readonly recentActivities = this._recentActivities.asReadonly();

  private readonly _assignmentsCount = signal<number>(4);
  public readonly assignmentsCount = this._assignmentsCount.asReadonly();

  // ── Métricas Clave Calculadas (Computed Signals) ──────────────────────────
  public readonly totalStudents = computed(() => this._students().length);

  public readonly activeStudents = computed(
    () => this._students().filter((s) => s.status === 'active').length
  );

  public readonly kpiMetrics = computed<KpiMetric[]>(() => [
    {
      id: 'total-students',
      label: 'TOTAL ESTUDIANTES',
      value: this.totalStudents(),
      icon: 'bi bi-people-fill',
      variant: 'blue',
    },
    {
      id: 'active-now',
      label: 'ACTIVOS AHORA',
      value: this.activeStudents(),
      icon: 'bi bi-broadcast',
      variant: 'purple',
    },
    {
      id: 'assignments',
      label: 'EVALUACIONES',
      value: this._assignmentsCount(),
      icon: 'bi bi-file-earmark-text',
      variant: 'amber',
    },
  ]);

  constructor() {
    this.initializeData();
  }

  // ── Métodos de Negocio ───────────────────────────────────────────────────

  /**
   * Registra un nuevo estudiante en el sistema y recalcula métricas
   */
  public registerStudent(dto: CreateStudentDto): StudentProgress {
    const statusLabels: Record<StudentStatus, string> = {
      active: 'Activo',
      'needs-attention': 'Requiere Atención',
      completed: 'Completado',
    };

    const newStudent: StudentProgress = {
      id: `std-${Date.now()}`,
      studentName: dto.studentName.trim(),
      email: dto.email.trim().toLowerCase(),
      topic: dto.topic.trim(),
      score: Math.min(100, Math.max(0, dto.score)),
      status: dto.status,
      statusLabel: statusLabels[dto.status] || 'Activo',
      registeredAt: new Date(),
    };

    this._students.update((prev) => [newStudent, ...prev]);

    // Registrar actividad reciente automáticamente
    this.addActivity(
      `Nuevo alumno registrado: ${newStudent.studentName} en ${newStudent.topic}.`,
      'blue',
      'bi bi-person-check-fill'
    );

    this.persistStudents();
    return newStudent;
  }

  /**
   * Actualiza el puntaje y estado de un estudiante
   */
  public updateStudentScore(id: string, newScore: number): void {
    const clampedScore = Math.min(100, Math.max(0, newScore));
    let updatedName = '';

    this._students.update((prev) =>
      prev.map((student) => {
        if (student.id !== id) return student;

        updatedName = student.studentName;
        let newStatus: StudentStatus = student.status;
        let newLabel = student.statusLabel;

        if (clampedScore === 100) {
          newStatus = 'completed';
          newLabel = 'Completado';
        } else if (clampedScore < 50) {
          newStatus = 'needs-attention';
          newLabel = 'Requiere Atención';
        } else {
          newStatus = 'active';
          newLabel = 'Activo';
        }

        return {
          ...student,
          score: clampedScore,
          status: newStatus,
          statusLabel: newLabel,
        };
      })
    );

    if (updatedName) {
      this.addActivity(
        `${updatedName} actualizó su puntaje a ${clampedScore}%.`,
        'purple',
        'bi bi-graph-up'
      );
      this.persistStudents();
    }
  }

  /**
   * Elimina un estudiante de la cohorte
   */
  public deleteStudent(id: string): void {
    const target = this._students().find((s) => s.id === id);
    this._students.update((prev) => prev.filter((s) => s.id !== id));

    if (target) {
      this.addActivity(
        `Se retiró el registro de ${target.studentName}.`,
        'purple',
        'bi bi-person-dash'
      );
      this.persistStudents();
    }
  }

  /**
   * Agrega un nuevo evento al feed de actividad reciente
   */
  public addActivity(
    description: string,
    iconType: 'blue' | 'purple',
    icon: string = 'bi bi-info-circle'
  ): void {
    const newAct: RecentActivity = {
      id: `act-${Date.now()}`,
      description,
      timeAgo: 'Hace un momento',
      icon,
      iconType,
    };

    this._recentActivities.update((prev) => [newAct, ...prev.slice(0, 5)]);
  }

  // ── Inicialización y Persistencia Segura (SSR Safe) ───────────────────────

  private initializeData(): void {
    const initialSeed: StudentProgress[] = [...INITIAL_STUDENTS_SEED];
    const initialActivities: RecentActivity[] = [...INITIAL_ACTIVITIES_SEED];

    if (!isPlatformBrowser(this.platformId)) {
      this._students.set(initialSeed);
      this._recentActivities.set(initialActivities);
      return;
    }

    // Carga desde localStorage si existe
    const stored = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    let loadedStudents: StudentProgress[] = initialSeed;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedStudents = parsed;
        }
      } catch (err) {
        console.warn('[ProfesorService] Error leyendo students de storage:', err);
      }
    }

    // Si algún usuario se registró previamente en la app con rol 'student', sincronizarlo
    const registeredUserRaw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USER);
    if (registeredUserRaw) {
      try {
        const regUser = JSON.parse(registeredUserRaw);
        if (regUser && regUser.role === 'student' && regUser.fullName) {
          const alreadyExists = loadedStudents.some(
            (s) => s.email?.toLowerCase() === regUser.email?.toLowerCase()
          );
          if (!alreadyExists) {
            loadedStudents.unshift({
              id: `std-reg-${Date.now()}`,
              studentName: regUser.fullName,
              email: regUser.email,
              topic: 'Biología: Mitosis',
              score: 80,
              status: 'active',
              statusLabel: 'Activo',
            });
          }
        }
      } catch {
        // Ignorar si el formato es inválido
      }
    }

    this._students.set(loadedStudents);
    this._recentActivities.set(initialActivities);
  }

  private persistStudents(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this._students()));
    } catch (e) {
      console.warn('[ProfesorService] No se pudo persistir estudiantes:', e);
    }
  }
}
