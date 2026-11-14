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
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe ocultar el indicador de rol al estudiante y mostrar el avatar sin alternar perspectiva', () => {
    const header: HTMLElement = fixture.nativeElement;
    const roleBadge = header.querySelector('.role-badge');
    const profile = header.querySelector('.user-profile-badge');

    expect(roleBadge).toBeNull();
    expect(profile?.tagName).toBe('DIV');
    expect(header.querySelector('[aria-label="Alternar rol académico"]')).toBeNull();
    expect(header.querySelector('button.user-profile-badge')).toBeNull();
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

  it('debe mostrar el perfil docente sin indicador ni selector de rol', () => {
    fixture.componentRef.setInput('currentUser', { ...mockStudentUser, role: 'professor' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.role-badge')).toBeNull();
    expect(fixture.nativeElement.querySelector('.role-badge-btn')).toBeNull();
  });
});
