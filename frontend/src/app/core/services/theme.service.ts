import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal, computed } from '@angular/core';

export type AppTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'disceria_theme_preference';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _currentTheme = signal<AppTheme>(this.getInitialTheme());

  public readonly currentTheme = this._currentTheme.asReadonly();
  public readonly isDarkMode = computed(() => this._currentTheme() === 'dark');

  constructor() {
    this.applyThemeToDocument(this._currentTheme());
  }

  /**
   * Cambia el tema activo y persiste en localStorage (SSR-safe)
   */
  public setTheme(theme: AppTheme): void {
    this._currentTheme.set(theme);
    this.applyThemeToDocument(theme);

    if (this.isBrowser) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (e) {
        console.warn('[ThemeService] No se pudo guardar la preferencia de tema:', e);
      }
    }
  }

  /**
   * Alterna entre modo claro y modo oscuro
   */
  public toggleTheme(): AppTheme {
    const nextTheme: AppTheme = this._currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
    return nextTheme;
  }

  /**
   * Determina el tema inicial desde localStorage o preferencia del sistema
   */
  private getInitialTheme(): AppTheme {
    if (!this.isBrowser) {
      return 'light';
    }

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }

      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Ignorar errores en entornos con storage bloqueado
    }

    return 'light';
  }

  /**
   * Aplica el atributo data-theme al elemento <html>
   */
  private applyThemeToDocument(theme: AppTheme): void {
    if (!this.isBrowser) return;

    const docEl = document.documentElement;
    docEl.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      docEl.classList.add('dark-theme');
    } else {
      docEl.classList.remove('dark-theme');
    }
  }
}

