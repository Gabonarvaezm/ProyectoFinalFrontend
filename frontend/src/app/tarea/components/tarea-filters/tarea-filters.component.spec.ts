import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TareaFiltersComponent } from './tarea-filters.component';

describe('TareaFiltersComponent', () => {
  let component: TareaFiltersComponent;
  let fixture: ComponentFixture<TareaFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TareaFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TareaFiltersComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('statuses', [
      { id: 'todas', label: 'Todas' },
      { id: 'pendiente', label: 'Pendientes' },
    ]);
    fixture.componentRef.setInput('subjects', ['Todas las Materias', 'Ciencias']);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe emitir searchChanged al ingresar texto en el buscador', () => {
    let query = '';
    component.searchChanged.subscribe((val) => (query = val));

    const input = fixture.nativeElement.querySelector('.search-input');
    input.value = 'Genética';
    input.dispatchEvent(new Event('input'));

    expect(query).toBe('Genética');
  });

  it('debe emitir statusChanged al seleccionar una píldora de estado', () => {
    let selected = '';
    component.statusChanged.subscribe((val) => (selected = val));

    const pills = fixture.nativeElement.querySelectorAll('.status-pill');
    pills[1].click();

    expect(selected).toBe('pendiente');
  });

  it('debe emitir createClicked cuando el profesor presiona el botón Nueva Tarea', () => {
    fixture.componentRef.setInput('isProfessor', true);
    fixture.detectChanges();

    let emitted = false;
    component.createClicked.subscribe(() => (emitted = true));

    const btn = fixture.nativeElement.querySelector('.btn-create-tarea');
    expect(btn).toBeTruthy();
    btn.click();

    expect(emitted).toBe(true);
  });
});

