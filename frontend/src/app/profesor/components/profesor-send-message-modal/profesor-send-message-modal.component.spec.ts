import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfesorSendMessageModalComponent } from './profesor-send-message-modal.component';

describe('ProfesorSendMessageModalComponent', () => {
  let component: ProfesorSendMessageModalComponent;
  let fixture: ComponentFixture<ProfesorSendMessageModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfesorSendMessageModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfesorSendMessageModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
    expect(component.messageForm).toBeTruthy();
  });

  it('debe validar que asunto y mensaje cumplan con las restricciones', () => {
    component.messageForm.setValue({
      targetGroup: 'all',
      subject: '',
      message: 'Corto',
      priority: 'normal',
      sendToForums: false,
    });

    expect(component.messageForm.invalid).toBe(true);
  });

  it('debe emitir messageSubmitted cuando el formulario es válido', () => {
    let emittedDto: unknown = null;
    component.messageSubmitted.subscribe((dto) => {
      emittedDto = dto;
    });

    component.messageForm.setValue({
      targetGroup: 'needs-attention',
      subject: 'Refuerzo de Mitosis',
      message: 'Estimados alumnos, los invito a repasar el material en la biblioteca.',
      priority: 'urgent',
      sendToForums: true,
    });

    expect(component.messageForm.valid).toBe(true);
    component.onSubmit();

    expect(emittedDto).toEqual({
      targetGroup: 'needs-attention',
      subject: 'Refuerzo de Mitosis',
      message: 'Estimados alumnos, los invito a repasar el material en la biblioteca.',
      priority: 'urgent',
      sendToForums: true,
    });
  });

  it('debe emitir closeModal al invocar onClose', () => {
    let closed = false;
    component.closeModal.subscribe(() => {
      closed = true;
    });

    component.onClose();
    expect(closed).toBe(true);
  });
});
