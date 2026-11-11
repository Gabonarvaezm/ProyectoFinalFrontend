import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, catchError, delay, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChatSession,
  ChatbotAcademicMode,
  ChatbotMessage,
} from '../../chatbot/models/chatbot.model';
import { STORAGE_KEYS } from '../models/auth.model';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

/**
 * Servicio Centralizado de Asistente Académico IA (ChatbotService).
 * Conecta directamente a la API de IA (Gemini / LLM) mediante HttpClient y environment.ts,
 * proveyendo un motor pedagógico local autónomo (Fallback Mock 100% offline).
 */
@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  public readonly sessions = signal<ChatSession[]>(this.loadStoredSessions());

  /**
   * Envía una consulta académica al servicio de IA.
   * Si la API Key está configurada, efectúa la petición HTTP a la API;
   * de lo contrario (o en caso de error/offline), responde mediante el motor pedagógico local.
   */
  public sendMessage(
    query: string,
    mode: ChatbotAcademicMode,
    _history: ChatbotMessage[] = []
  ): Observable<ChatbotMessage> {
    const trimmedQuery = query.trim();
    const apiKey = environment.ai?.apiKey?.trim();

    if (apiKey && apiKey.length > 5) {
      return this.sendToAiApi(trimmedQuery, mode, apiKey).pipe(
        catchError((err) => {
          console.warn('[ChatbotService] Error en llamada HTTP a la API de IA. Activando motor local:', err);
          return of(this.generateLocalAcademicFallback(trimmedQuery, mode));
        })
      );
    }

    // Modalidad 100% Local / Mock Pedagógico
    return of(this.generateLocalAcademicFallback(trimmedQuery, mode)).pipe(delay(700));
  }

  /**
   * Petición HTTP directa a la API de Inteligencia Artificial configurada en environment
   */
  private sendToAiApi(
    query: string,
    mode: ChatbotAcademicMode,
    apiKey: string
  ): Observable<ChatbotMessage> {
    const url = `${environment.ai.endpoint}?key=${apiKey}`;
    const systemPrompt = this.resolveSystemInstruction(mode);

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nConsulta del estudiante: ${query}` }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1200,
      },
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<GeminiResponse>(url, body, { headers }).pipe(
      map((response) => {
        const generatedText =
          response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
          'No fue posible obtener una respuesta adecuada del modelo. Consulta al tutor presencial.';

        return {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: generatedText,
          timestamp: new Date(),
          mode,
        };
      })
    );
  }

  /**
   * Generador de respuestas académicas pedagógicas locales (Cero dependencias externas)
   */
  public generateLocalAcademicFallback(
    query: string,
    mode: ChatbotAcademicMode
  ): ChatbotMessage {
    const lower = query.toLowerCase();

    if (mode === 'exam-generator' || lower.includes('examen') || lower.includes('preguntas')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Aquí tienes una evaluación formativa de 3 preguntas basada en tu solicitud:\n\n**Pregunta 1:** ¿Cuál es la principal característica de una función continua en un intervalo cerrado [a, b]?\na) Posee asíntotas verticales.\nb) Alcanza un valor máximo y mínimo absoluto (Teorema de Weierstrass).\nc) Su derivada siempre existe en todos los puntos.\n*Respuesta correcta: b*\n\n**Pregunta 2:** En el cálculo de integrales por partes, la fórmula fundamental se deriva de:\na) La regla de la cadena.\nb) La regla del producto para derivadas.\nc) El teorema de Taylor.\n*Respuesta correcta: b*\n\n**Pregunta 3:** ¿Qué ocurre durante la profase mitótica?\na) Los cromosomas se alinean en el ecuador.\nb) La cromatina se condensa y desaparece la envoltura nuclear.\nc) Se divide el citoplasma.\n*Respuesta correcta: b*`,
        timestamp: new Date(),
        mode: 'exam-generator',
      };
    }

    if (mode === 'step-by-step' || lower.includes('paso a paso') || lower.includes('ejercicio')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Resolución metódica paso a paso para: **"${query}"**\n\n1. **Identificación de variables y condiciones iniciales:**\n   Definimos el dominio de la expresión y los parámetros restringidos.\n2. **Selección del método analítico:**\n   Aplicamos la técnica estándar acorde a la literatura académica recomendada.\n3. **Desarrollo algebraico estructurado:**\n   Despejamos y simplificamos aplicando propiedades fundamentales sin saltar operaciones intermedias.\n4. **Verificación del resultado:**\n   Comprobamos la coherencia dimensional o sustitución directa en la ecuación original.\n\n*Consejo pedagógico: Revisa los ejercicios de autoevaluación en la Biblioteca Digital DiscerIA.*`,
        timestamp: new Date(),
        mode: 'step-by-step',
      };
    }

    if (mode === 'bibliography' || lower.includes('bibliografía') || lower.includes('libro')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Referencias bibliográficas y citas académicas pertinentes para tu consulta:\n\n- **Stewart, J. (2016).** *Cálculo de una variable: Trascendentes tempranas* (8va ed.). Cengage Learning. (Capítulo 7: Técnicas de integración).\n- **Campbell, N. A. & Reece, J. B. (2007).** *Biología General* (7ma ed.). Editorial Médica Panamericana. (Unidad 2: La célula y ciclo mitótico).\n- **Gomis, J. (2020).** *Estructuras de Datos y Algoritmos en Python Moderno*. Ediciones Académicas DiscerIA.\n\n*Puedes consultar el texto completo en formato PDF o interactivo en nuestra Biblioteca.*`,
        timestamp: new Date(),
        mode: 'bibliography',
      };
    }

    // Modo Tutor por Defecto
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `Entendido. Como tutor académico en DiscerIA, te explico los fundamentos clave sobre **"${query}"**:\n\n- **Principio Esencial:** El concepto se fundamenta en modelos teóricos validados, donde la comprensión de la base conceptual permite resolver problemas de mayor complejidad.\n- **Aplicación Práctica:** En el ámbito universitario, este razonamiento se aplica comúnmente al análisis de casos reales y al desarrollo de proyectos de investigación formativa.\n- **Siguiente paso sugerido:** Te recomiendo revisar el material en la sección de Biblioteca o consultar una duda puntual en los Foros de la materia.`,
      timestamp: new Date(),
      mode: 'tutor',
    };
  }

  private resolveSystemInstruction(mode: ChatbotAcademicMode): string {
    switch (mode) {
      case 'step-by-step':
        return 'Eres un tutor universitario experto en resolución analítica paso a paso. Explica cada etapa didácticamente y sin omitir pasos.';
      case 'exam-generator':
        return 'Eres un generador pedagógico de exámenes para educación superior. Presenta preguntas con opciones múltiples y su respectiva retroalimentación.';
      case 'bibliography':
        return 'Eres un bibliotecario académico universitario. Proporciona citas rigurosas en formato APA y referencias a textos formales.';
      default:
        return 'Eres el asistente virtual pedagógico DiscerIA Context AI. Ayuda a estudiantes universitarios a entender conceptos complejos con claridad y rigor.';
    }
  }

  // ── Persistencia de Sesiones de Conversación ──────────────────────────────

  public loadStoredSessions(): ChatSession[] {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
        if (stored) {
          const parsed = JSON.parse(stored) as ChatSession[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((s) => ({
              ...s,
              updatedAt: new Date(s.updatedAt),
            }));
          }
        }
      } catch (err) {
        console.warn('[ChatbotService] Error al leer sesiones de chat:', err);
      }
    }

    return [
      {
        id: 'session-1',
        title: 'Técnicas de Integración por Partes',
        lastMessage: 'Recuerda usar la regla LIATE para definir u y dv...',
        updatedAt: new Date(Date.now() - 3600000),
        messageCount: 4,
      },
      {
        id: 'session-2',
        title: 'Fases de la Mitosis Celular',
        lastMessage: 'En la anafase los cromátidas hermanas se separan...',
        updatedAt: new Date(Date.now() - 86400000),
        messageCount: 6,
      },
      {
        id: 'session-3',
        title: 'Filosofía Política de Hobbes y Locke',
        lastMessage: 'Hobbes postula el Leviatán frente al estado de naturaleza...',
        updatedAt: new Date(Date.now() - 172800000),
        messageCount: 2,
      },
    ];
  }

  public persistSessions(sessions: ChatSession[]): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
      } catch (err) {
        console.warn('[ChatbotService] Error al persistir sesiones:', err);
      }
    }
  }
}

