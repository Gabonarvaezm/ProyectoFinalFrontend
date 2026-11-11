import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ChatbotService } from './chatbot.service';
import { environment } from '../../../environments/environment';
import { STORAGE_KEYS } from '../models/auth.model';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEYS.CHAT_SESSIONS);

    TestBed.configureTestingModule({
      providers: [
        ChatbotService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ChatbotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(STORAGE_KEYS.CHAT_SESSIONS);
  });

  it('debe crearse correctamente e inicializar las sesiones guardadas o por defecto', () => {
    expect(service).toBeTruthy();
    expect(service.sessions().length).toBeGreaterThan(0);
  });

  it('debe responder con el motor local mock cuando no hay API Key configurada', async () => {
    environment.ai.apiKey = ''; // Sin API key

    const response$ = service.sendMessage('Explica la mitosis celular', 'tutor');
    const msg = await firstValueFrom(response$);

    expect(msg).toBeTruthy();
    expect(msg.sender).toBe('ai');
    expect(msg.mode).toBe('tutor');
    expect(msg.text).toContain('mitosis celular');
  });

  it('debe generar exámenes formativos en el modo exam-generator', () => {
    const msg = service.generateLocalAcademicFallback('Generar examen de cálculo', 'exam-generator');

    expect(msg.mode).toBe('exam-generator');
    expect(msg.text).toContain('Pregunta 1');
    expect(msg.text).toContain('Pregunta 2');
    expect(msg.text).toContain('Pregunta 3');
  });

  it('debe generar resolución analítica paso a paso en el modo step-by-step', () => {
    const msg = service.generateLocalAcademicFallback('Resolver integral definida', 'step-by-step');

    expect(msg.mode).toBe('step-by-step');
    expect(msg.text).toContain('paso a paso');
    expect(msg.text).toContain('Identificación de variables');
  });

  it('debe persistir sesiones en localStorage', () => {
    const testSessions = [
      {
        id: 'sess-test-1',
        title: 'Consulta de Termodinámica',
        lastMessage: 'Primera ley de la termodinámica aplicada...',
        updatedAt: new Date(),
        messageCount: 2,
      },
    ];

    service.persistSessions(testSessions);

    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed[0].id).toBe('sess-test-1');
  });
});
