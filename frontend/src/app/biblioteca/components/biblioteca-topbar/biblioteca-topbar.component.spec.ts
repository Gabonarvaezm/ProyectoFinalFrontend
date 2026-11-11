import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BibliotecaTopbarComponent } from './biblioteca-topbar.component';

describe('BibliotecaTopbarComponent', () => {
  let component: BibliotecaTopbarComponent;
  let fixture: ComponentFixture<BibliotecaTopbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BibliotecaTopbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BibliotecaTopbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe emitir searchQueryChange cuando el usuario escribe en el buscador', () => {
    let emitted = '';
    component.searchQueryChange.subscribe((val) => {
      emitted = val;
    });

    const input = fixture.nativeElement.querySelector('.header-search-input');
    input.value = 'Química Orgánica';
    input.dispatchEvent(new Event('input'));

    expect(emitted).toBe('Química Orgánica');
  });

  it('debe emitir aiClicked, notificationsClicked y configClicked al presionar los botones de acción', () => {
    let aiEmitted = false;
    let notifEmitted = false;
    let configEmitted = false;

    component.aiClicked.subscribe(() => (aiEmitted = true));
    component.notificationsClicked.subscribe(() => (notifEmitted = true));
    component.configClicked.subscribe(() => (configEmitted = true));

    const aiBtn = fixture.nativeElement.querySelector('.btn-ai-toggle');
    const notifBtn = fixture.nativeElement.querySelectorAll('.icon-btn')[1];
    const configBtn = fixture.nativeElement.querySelectorAll('.icon-btn')[2];

    aiBtn.click();
    notifBtn.click();
    configBtn.click();

    expect(aiEmitted).toBe(true);
    expect(notifEmitted).toBe(true);
    expect(configEmitted).toBe(true);
  });

  it('debe renderizar las iniciales del usuario en el avatar del perfil', () => {
    fixture.componentRef.setInput('userInitials', 'AS');
    fixture.detectChanges();

    const avatar = fixture.nativeElement.querySelector('.user-avatar-initials');
    expect(avatar.textContent.trim()).toBe('AS');
  });
});

