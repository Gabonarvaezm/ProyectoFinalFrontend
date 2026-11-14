import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatSession, ChatbotAcademicMode, ChatbotMessage } from '../../chatbot/models/chatbot.model';
import { STORAGE_KEYS } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  public readonly sessions = signal<ChatSession[]>(this.loadStoredSessions());

  public sendMessage(
    query: string,
    mode: ChatbotAcademicMode,
    history: readonly ChatbotMessage[] = []
  ): Observable<ChatbotMessage> {
    const messages = history
      .filter((message) => message.sender === 'user' || message.sender === 'ai')
      .slice(-20)
      .map((message) => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
      }));

    return this.http.post<{ text: string }>(environment.ai.endpoint, {
      query: query.trim(), mode, history: messages,
    }).pipe(map((response) => ({
      id: `ai-${Date.now()}`,
      sender: 'ai' as const,
      text: response.text,
      timestamp: new Date(),
      mode,
    })), catchError((error: unknown) => {
      const detail: unknown = error instanceof HttpErrorResponse ? error.error : null;
      const message = typeof detail === 'object' && detail !== null &&
        'error' in detail && typeof detail.error === 'string'
          ? detail.error
          : 'No se pudo conectar con el asistente. Intenta de nuevo en unos momentos.';
      return throwError(() => new Error(message));
    }));
  }

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

