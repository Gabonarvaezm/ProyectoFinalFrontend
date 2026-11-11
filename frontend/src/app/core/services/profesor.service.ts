import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { STORAGE_KEYS } from '../models/auth.model';
import {
  CohortAnalysisSummary,
  CreateExamDto,
  CreateStudentDto,
  KpiMetric,
  RecentActivity,
  SendMessageDto,
  StudentProgress,
  StudentStatus,
  TeacherNotification,
} from '../../profesor/models/profesor.model';
import {
  INITIAL_ACTIVITIES_SEED,
  INITIAL_NOTIFICATIONS_SEED,
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

  // ── Notificaciones del Profesor (Signals) ────────────────────────────────
  private readonly _notifications = signal<TeacherNotification[]>([]);
  public readonly notifications = this._notifications.asReadonly();

  /** Conteo dinámico de notificaciones no leídas */
  public readonly unreadNotificationsCount = computed(
    () => this._notifications().filter((n) => !n.read).length
  );

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

  // ── Métodos de Negocio: Estudiantes ──────────────────────────────────────

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

  // ── Métodos de Negocio: Exámenes y Mensajes a la Clase ───────────────────

  /**
   * Registra un nuevo examen académico creado por el profesor
   */
  public createExam(dto: CreateExamDto): void {
    this._assignmentsCount.update((count) => count + 1);

    this.addActivity(
      `Nuevo examen creado: "${dto.title}" (${dto.questionsCount} preguntas - Dif. ${dto.difficulty}).`,
      'blue',
      'bi bi-file-earmark-check-fill'
    );

    this.addNotification({
      type: 'academic_alert',
      title: `Examen publicado: ${dto.title}`,
      message: `La evaluación para "${dto.topic}" (${dto.durationMinutes} min) ha sido programada con éxito para los estudiantes.`,
      timeAgo: 'Hace un momento',
      read: false,
      authorName: 'Sistema de Evaluaciones',
      authorRole: 'system',
      authorInitials: 'SE',
      category: dto.subject,
    });
  }

  /**
   * Envía un mensaje o comunicado oficial a la clase
   */
  public sendMessageToClass(dto: SendMessageDto): void {
    const targetLabel =
      dto.targetGroup === 'all'
        ? 'toda la clase'
        : dto.targetGroup === 'needs-attention'
        ? 'estudiantes que requieren atención'
        : 'estudiantes activos';

    this.addActivity(
      `Mensaje enviado a ${targetLabel}: "${dto.subject}".`,
      'purple',
      'bi bi-megaphone-fill'
    );

    this.addNotification({
      type: 'teacher_post',
      title: `Comunicado a la Clase: ${dto.subject}`,
      message: `${dto.message} (Destinatarios: ${targetLabel})`,
      timeAgo: 'Hace un momento',
      read: true,
      authorName: 'Prof. García',
      authorRole: 'professor',
      authorInitials: 'PG',
      category: dto.priority === 'urgent' ? 'Urgente' : 'General',
    });
  }

  /**
   * Genera un diagnóstico cuantitativo y cualitativo de la cohorte actual
   */
  public getCohortAnalysis(): CohortAnalysisSummary {
    const students = this._students();
    const total = students.length;

    if (total === 0) {
      return {
        totalStudents: 0,
        averageScore: 0,
        passingRate: 0,
        atRiskCount: 0,
        completedCount: 0,
        activeCount: 0,
        topPerformingTopic: 'N/A',
        challengingTopic: 'N/A',
        aiPedagogicalAdvice: 'No hay estudiantes registrados para analizar.',
      };
    }

    const totalScore = students.reduce((acc, s) => acc + s.score, 0);
    const averageScore = Math.round(totalScore / total);
    const passingCount = students.filter((s) => s.score >= 60).length;
    const passingRate = Math.round((passingCount / total) * 100);
    const atRiskCount = students.filter((s) => s.status === 'needs-attention' || s.score < 50).length;
    const completedCount = students.filter((s) => s.status === 'completed' || s.score === 100).length;
    const activeCount = students.filter((s) => s.status === 'active').length;

    // Calcular tópico con menor puntaje
    const topicScores: Record<string, { total: number; count: number }> = {};
    students.forEach((s) => {
      if (!topicScores[s.topic]) topicScores[s.topic] = { total: 0, count: 0 };
      topicScores[s.topic].total += s.score;
      topicScores[s.topic].count += 1;
    });

    let challengingTopic = 'Biología Celular';
    let topPerformingTopic = 'Genética Mendeliana';
    let minAvg = Infinity;
    let maxAvg = -Infinity;

    Object.entries(topicScores).forEach(([topic, data]) => {
      const avg = data.total / data.count;
      if (avg < minAvg) {
        minAvg = avg;
        challengingTopic = topic;
      }
      if (avg > maxAvg) {
        maxAvg = avg;
        topPerformingTopic = topic;
      }
    });

    const aiAdvice =
      atRiskCount > 0
        ? `Se identificaron ${atRiskCount} estudiante(s) con rendimiento crítico en "${challengingTopic}". Se sugiere programar una sesión de refuerzo conceptual y publicar material complementario en la biblioteca.`
        : `La cohorte presenta un excelente desempeño con un ${passingRate}% de aprobación. El tópico más consolidado es "${topPerformingTopic}".`;

    return {
      totalStudents: total,
      averageScore,
      passingRate,
      atRiskCount,
      completedCount,
      activeCount,
      topPerformingTopic,
      challengingTopic,
      aiPedagogicalAdvice: aiAdvice,
    };
  }

  // ── Métodos de Negocio: Notificaciones ───────────────────────────────────

  /**
   * Marca una notificación específica como leída
   */
  public markNotificationAsRead(id: string): void {
    this._notifications.update((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    this.persistNotifications();
  }

  /**
   * Alterna el estado leído/no leído de una notificación
   */
  public toggleNotificationRead(id: string): void {
    this._notifications.update((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
    this.persistNotifications();
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  public markAllNotificationsAsRead(): void {
    this._notifications.update((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
    this.persistNotifications();
  }

  /**
   * Elimina una notificación de la lista
   */
  public deleteNotification(id: string): void {
    this._notifications.update((prev) => prev.filter((n) => n.id !== id));
    this.persistNotifications();
  }

  /**
   * Añade una nueva notificación al inicio de la lista
   */
  public addNotification(
    data: Omit<TeacherNotification, 'id' | 'timestamp'>
  ): TeacherNotification {
    const newNotification: TeacherNotification = {
      ...data,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    this._notifications.update((prev) => [newNotification, ...prev]);
    this.persistNotifications();
    return newNotification;
  }

  // ── Inicialización y Persistencia Segura (SSR Safe) ───────────────────────

  private initializeData(): void {
    const initialSeed: StudentProgress[] = [...INITIAL_STUDENTS_SEED];
    const initialActivities: RecentActivity[] = [...INITIAL_ACTIVITIES_SEED];
    const initialNotifications: TeacherNotification[] = [...INITIAL_NOTIFICATIONS_SEED];

    if (!isPlatformBrowser(this.platformId)) {
      this._students.set(initialSeed);
      this._recentActivities.set(initialActivities);
      this._notifications.set(initialNotifications);
      return;
    }

    // Carga de estudiantes desde localStorage si existe
    const storedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    let loadedStudents: StudentProgress[] = initialSeed;

    if (storedStudents) {
      try {
        const parsed = JSON.parse(storedStudents);
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

    // Carga de notificaciones desde localStorage si existe
    let loadedNotifications: TeacherNotification[] = initialNotifications;
    const storedNotifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (storedNotifications) {
      try {
        const parsedNotifs = JSON.parse(storedNotifications);
        if (Array.isArray(parsedNotifs) && parsedNotifs.length > 0) {
          loadedNotifications = parsedNotifs;
        }
      } catch (err) {
        console.warn('[ProfesorService] Error leyendo notificaciones de storage:', err);
      }
    }

    this._students.set(loadedStudents);
    this._recentActivities.set(initialActivities);
    this._notifications.set(loadedNotifications);
  }

  private persistStudents(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this._students()));
    } catch (e) {
      console.warn('[ProfesorService] No se pudo persistir estudiantes:', e);
    }
  }

  private persistNotifications(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this._notifications()));
    } catch (e) {
      console.warn('[ProfesorService] No se pudo persistir notificaciones:', e);
    }
  }
}
