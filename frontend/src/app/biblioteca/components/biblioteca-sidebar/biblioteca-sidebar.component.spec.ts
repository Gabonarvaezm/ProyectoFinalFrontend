import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BibliotecaSidebarComponent } from './biblioteca-sidebar.component';

describe('BibliotecaSidebarComponent', () => {
  let component: BibliotecaSidebarComponent;
  let fixture: ComponentFixture<BibliotecaSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BibliotecaSidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BibliotecaSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe contener los 5 items de navegación institucional con biblioteca activa por defecto', () => {
    const items = component.navItems();
    expect(items.length).toBe(5);
    expect(items.some((i) => i.id === 'biblioteca')).toBe(true);
    expect(items.some((i) => i.id === 'dashboard')).toBe(true);
    expect(items.some((i) => i.id === 'foros')).toBe(true);
    expect(component.activeNav()).toBe('biblioteca');
  });

  it('debe emitir publishBookClicked al pulsar el botón de publicar libro', () => {
    fixture.componentRef.setInput('isProfessor', true);
    fixture.detectChanges();

    let emitted = false;
    component.publishBookClicked.subscribe(() => {
      emitted = true;
    });

    const button = fixture.nativeElement.querySelector('.new-book-btn');
    expect(button).toBeTruthy();
    button.click();

    expect(emitted).toBe(true);
  });

  it('debe mostrar la insignia institucional cuando no es docente', () => {
    fixture.componentRef.setInput('isProfessor', false);
    fixture.componentRef.setInput('institution', 'Universidad Nacional');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.institution-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Universidad Nacional');
  });
});

