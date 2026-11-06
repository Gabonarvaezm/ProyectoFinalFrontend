import { TestBed } from '@angular/core/testing';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark-theme');

    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark-theme');
  });

  it('debe crearse correctamente e inicializar en light por defecto', () => {
    expect(service).toBeTruthy();
    expect(service.currentTheme()).toBe('light');
    expect(service.isDarkMode()).toBe(false);
  });

  it('debe permitir cambiar de tema con setTheme()', () => {
    service.setTheme('dark');
    expect(service.currentTheme()).toBe('dark');
    expect(service.isDarkMode()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('debe alternar de tema correctamente con toggleTheme()', () => {
    expect(service.currentTheme()).toBe('light');
    const newTheme = service.toggleTheme();
    expect(newTheme).toBe('dark');
    expect(service.currentTheme()).toBe('dark');
    expect(service.isDarkMode()).toBe(true);

    const backToLight = service.toggleTheme();
    expect(backToLight).toBe('light');
    expect(service.currentTheme()).toBe('light');
    expect(service.isDarkMode()).toBe(false);
  });
});

