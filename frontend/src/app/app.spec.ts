import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { THEME_STORAGE_KEY } from './core/services/theme.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have title DiscerIA', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app['title']()).toBe('DiscerIA');
  });

  it('debe restaurar el modo oscuro al iniciar cualquier ruta', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    try {
      TestBed.createComponent(App);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    } finally {
      localStorage.removeItem(THEME_STORAGE_KEY);
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark-theme');
    }
  });
});
