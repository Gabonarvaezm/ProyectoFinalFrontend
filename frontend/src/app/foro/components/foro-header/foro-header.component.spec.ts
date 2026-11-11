import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ForoHeaderComponent } from './foro-header.component';
import { ForumAuthor } from '../../models/foro.model';

describe('ForoHeaderComponent', () => {
  let component: ForoHeaderComponent;
  let fixture: ComponentFixture<ForoHeaderComponent>;

  const mockStudentUser: ForumAuthor = {
    id: 'usr-1',
    name: 'Alejandro Silva',
    role: 'student',
    roleTitle: 'Estudiante Académico',
    institution: 'Universidad Nacional',
    avatar: 'https://example.com/avatar.jpg',
    initials: 'AS',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForoHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ForoHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentUser', mockStudentUser);
    fixture.componentRef.setInput('currentRole', 'student');
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe emitir roleToggled al pulsar el botón de alternar rol o el avatar', () => {
    let toggledCount = 0;
    component.roleToggled.subscribe(() => {
      toggledCount++;
    });

    const roleBtn = fixture.nativeElement.querySelector('.role-badge-btn');
    const profileBtn = fixture.nativeElement.querySelector('.user-profile-badge');

    roleBtn.click();
    profileBtn.click();

    expect(toggledCount).toBe(2);
  });

  it('debe emitir aiToggleClicked al presionar el botón de asistente de IA', () => {
    let aiToggled = false;
    component.aiToggleClicked.subscribe(() => {
      aiToggled = true;
    });

    const aiBtn = fixture.nativeElement.querySelector('.btn-ai-toggle');
    aiBtn.click();

    expect(aiToggled).toBe(true);
  });

  it('debe actualizar el modelo searchQuery al escribir en el buscador', () => {
    const input = fixture.nativeElement.querySelector('.header-search-input');
    input.value = 'Ecuaciones diferenciales';
    input.dispatchEvent(new Event('input'));

    expect(component.searchQuery()).toBe('Ecuaciones diferenciales');
  });

  it('debe limpiar la búsqueda al hacer clic en el botón de limpiar', () => {
    component.searchQuery.set('Consulta previa');
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.btn-clear-search');
    expect(clearBtn).toBeTruthy();

    clearBtn.click();
    expect(component.searchQuery()).toBe('');
  });

  it('debe mostrar iniciales fallback cuando la imagen de avatar falla al cargar', () => {
    expect(component.avatarLoadError()).toBe(false);

    component.onAvatarError();
    fixture.detectChanges();

    expect(component.avatarLoadError()).toBe(true);
    const initialsEl = fixture.nativeElement.querySelector('.user-avatar-initials');
    expect(initialsEl).toBeTruthy();
    expect(initialsEl.textContent.trim()).toBe('AS');
  });

  it('debe reflejar la clase docente cuando el rol es professor', () => {
    fixture.componentRef.setInput('currentRole', 'professor');
    fixture.detectChanges();

    const roleBtn = fixture.nativeElement.querySelector('.role-badge-btn');
    expect(roleBtn.classList.contains('docente')).toBe(true);
    expect(roleBtn.textContent).toContain('Docente');
  });
});

