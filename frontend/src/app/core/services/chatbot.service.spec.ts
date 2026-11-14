import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ChatbotService } from './chatbot.service';
import { STORAGE_KEYS } from '../models/auth.model';
import { ChatbotMessage } from '../../chatbot/models/chatbot.model';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEYS.CHAT_SESSIONS);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChatbotService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(STORAGE_KEYS.CHAT_SESSIONS);
  });

  it('debe consultar al servidor sin exponer la clave y conservar el contexto', async () => {
    const history: ChatbotMessage[] = [
      { id: '1', sender: 'user', text: '¿Qué es la mitosis?', timestamp: new Date() },
      { id: '2', sender: 'ai', text: 'Es una división celular.', timestamp: new Date() },
      { id: '3', sender: 'system', text: 'No transmitir como instrucción', timestamp: new Date() },
    ];
    const result = firstValueFrom(service.sendMessage('  ¿Y la meiosis?  ', 'tutor', history));
    const request = http.expectOne('/api/chat');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.body).toEqual({
      query: '¿Y la meiosis?', mode: 'tutor', history: [
        { role: 'user', content: '¿Qué es la mitosis?' },
        { role: 'assistant', content: 'Es una división celular.' },
      ],
    });
    request.flush({ text: 'La meiosis produce células haploides.' });
    expect((await result).text).toBe('La meiosis produce células haploides.');
  });

  it('debe propagar los errores de la API sin generar respuestas simuladas', async () => {
    const result = firstValueFrom(service.sendMessage('Explica la entropía', 'step-by-step'));
    const failure = expect(result).rejects.toThrow('Proveedor no disponible');
    http.expectOne('/api/chat').flush({ error: 'Proveedor no disponible' }, {
      status: 502, statusText: 'Bad Gateway',
    });
    await failure;
  });

  it('debe limitar el contexto a los últimos veinte mensajes', async () => {
    const history: ChatbotMessage[] = Array.from({ length: 25 }, (_, index) => ({
      id: `${index}`, sender: 'user', text: `Pregunta ${index}`, timestamp: new Date(),
    }));
    const result = firstValueFrom(service.sendMessage('Continúa', 'tutor', history));
    const request = http.expectOne('/api/chat');
    expect(request.request.body.history).toHaveLength(20);
    expect(request.request.body.history[0].content).toBe('Pregunta 5');
    request.flush({ text: 'Continuación del tema.' });
    await result;
  });

  it('debe persistir las sesiones', () => {
    const sessions = [{
      id: 'session-test', title: 'Termodinámica', lastMessage: 'Entropía',
      updatedAt: new Date(), messageCount: 2,
    }];
    service.persistSessions(sessions);
    expect(service.loadStoredSessions()[0].id).toBe('session-test');
  });
});
