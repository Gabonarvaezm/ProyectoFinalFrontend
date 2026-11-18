import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareaCardComponent } from './tarea-card.component';
import { Tarea } from '../../models/tarea.model';

describe('TareaCardComponent', () => {
  let component: TareaCardComponent;
  let fixture: ComponentFixture<TareaCardComponent>;

  const mockTarea: Tarea = {
    id: 'tar-test',
    title: 'Tarea de Prueba',
    description: 'Descripción de prueba detallada.',
    subject: 'Ciencias',
    dueDate: '2026-11-20',
    maxScore: 100,
    priority: 'alta',
    assignedBy: 'Prof. Mendoza',
    assignedDate: '2026-11-08',
    status: 'pendiente',
    submissionsCount: 5,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TareaCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TareaCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tarea', mockTarea);
    fixture.detectChanges();
  });

  it('debe crearse correctamente y mostrar los datos de la tarea', () => {
    expect(component).toBeTruthy();
    const titleEl = fixture.nativeElement.querySelector('.tarea-title');
    expect(titleEl.textContent).toContain('Tarea de Prueba');
  });

  it('debe emitir cardClicked al hacer clic en la tarjeta', () => {
    let clicked: Tarea | null = null;
    component.cardClicked.subscribe((t) => (clicked = t));

    const card = fixture.nativeElement.querySelector('.tarea-card');
    card.click();

    expect(clicked).toBe(mockTarea);
  });

  it('debe emitir actionClicked al hacer clic en el botón de entrega', () => {
    let actionItem: Tarea | null = null;
    component.actionClicked.subscribe((t) => (actionItem = t));

    const actionBtn = fixture.nativeElement.querySelector('.btn-card-submit');
    expect(actionBtn).toBeTruthy();
    actionBtn.click();

    expect(actionItem).toBe(mockTarea);
  });

  it('debe emitir deleteClicked cuando el profesor pulsa el botón de eliminar', () => {
    fixture.componentRef.setInput('isProfessor', true);
    fixture.detectChanges();

    let deletedId = '';
    component.deleteClicked.subscribe((id) => (deletedId = id));

    const deleteBtn = fixture.nativeElement.querySelector('.btn-icon-delete');
    expect(deleteBtn).toBeTruthy();
    deleteBtn.click();

    expect(deletedId).toBe(mockTarea.id);
  });
});

