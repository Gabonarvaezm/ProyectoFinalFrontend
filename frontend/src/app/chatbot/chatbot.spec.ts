import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Chatbot } from './chatbot';

describe('Chatbot Component (Smart Parent & Presentational Child Nodes)', () => {
  let component: Chatbot;
  let fixture: ComponentFixture<Chatbot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chatbot],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Chatbot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe crearse correctamente el componente Chatbot y sus nodos hijos', () => {
    expect(component).toBeTruthy();
    expect(component.messages().length).toBeGreaterThan(0);
    expect(component.activeMode()).toBe('tutor');
    expect(component.chatForm).toBeTruthy();
  });

  it('debe validar que el campo message del formulario reactivo sea requerido y cumpla longitud mínima', () => {
    const ctrl = component.chatForm.get('message');
    ctrl?.setValue('');
    expect(ctrl?.hasError('required')).toBe(true);
    expect(component.chatForm.invalid).toBe(true);

    ctrl?.setValue('a');
    expect(ctrl?.hasError('minlength')).toBe(true);

    ctrl?.setValue('¿Qué es la mitosis?');
    expect(component.chatForm.valid).toBe(true);
  });

  it('debe agregar mensaje del usuario y simular respuesta contextual de la IA', () => {
    vi.useFakeTimers();

    const initialCount = component.messages().length;
    component.chatForm.patchValue({ message: 'Explica el cálculo de una integral definida' });

    component.handleSendMessage();

    // El mensaje del usuario debe sumarse de inmediato
    expect(component.messages().length).toBe(initialCount + 1);
    expect(component.isThinking()).toBe(true);

    // Avanzar temporizador de respuesta simulada
    vi.advanceTimersByTime(800);

    // Respuesta de la IA recibida
    expect(component.messages().length).toBe(initialCount + 2);
    expect(component.isThinking()).toBe(false);
    expect(component.messages()[component.messages().length - 1].sender).toBe('ai');
  });

  it('debe cambiar de modo académico y actualizar activeModeLabel', () => {
    expect(component.activeMode()).toBe('tutor');
    component.handleModeSelected('exam-generator');
    expect(component.activeMode()).toBe('exam-generator');
    expect(component.activeModeLabel()).toBe('Generador de Exámenes');
  });

  it('debe autocompletar y enviar mensaje al seleccionar un quick prompt', () => {
    vi.useFakeTimers();

    const prompt = component.quickPrompts()[0];
    const initialCount = component.messages().length;

    component.handlePromptSelected(prompt);

    expect(component.messages().length).toBe(initialCount + 1);
    expect(component.messages()[initialCount].text).toBe(prompt.promptText);

    vi.advanceTimersByTime(800);
    expect(component.messages().length).toBe(initialCount + 2);
  });

  it('debe crear una nueva sesión de chat', () => {
    const initialSessions = component.sessions().length;
    component.handleNewChat();

    expect(component.sessions().length).toBe(initialSessions + 1);
    expect(component.messages().length).toBe(1);
    expect(component.messages()[0].sender).toBe('ai');
  });

  it('debe reiniciar el historial de mensajes de la sesión activa', () => {
    component.handleClearHistory();
    expect(component.messages().length).toBe(1);
    expect(component.messages()[0].text).toContain('historial de esta sesión ha sido restablecido');
  });
});
