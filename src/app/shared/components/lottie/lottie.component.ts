import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import type { AnimationItem } from 'lottie-web';
import { LOTTIE_PRESETS, LottiePreset } from './lottie-presets';

@Component({
  selector: 'app-lottie',
  template: `
    <div
      #lottieContainer
      class="lottie-host-wrapper"
      role="img"
      [attr.aria-label]="ariaLabel()"
      [style.width]="width()"
      [style.height]="height()"
    ></div>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }

    .lottie-host-wrapper {
      display: inline-block;
      overflow: hidden;
      max-width: 100%;
    }

    .lottie-host-wrapper svg {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }
  `,
})
export class LottieComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  /** Referencia del contenedor DOM donde se montará la animación */
  protected readonly container = viewChild<ElementRef<HTMLDivElement>>('lottieContainer');

  /** Instancia activa del reproductor Lottie */
  private animationItem: AnimationItem | null = null;

  // ── Inputs con Signals ──────────────────────────────────────────────────────
  /** Nombre del preset incluido en DiscerIA ('ai-thinking' | 'success' | 'loading' | 'empty-library') */
  public readonly name = input<LottiePreset | null>(null);

  /** Datos JSON directos de la animación Lottie (opcional si se pasa `name`) */
  public readonly animationData = input<object | null>(null);

  /** Ruta URL o path de assets a un archivo JSON externo */
  public readonly path = input<string | null>(null);

  /** Si la animación debe reproducirse en bucle */
  public readonly loop = input<boolean>(true);

  /** Si la animación debe iniciar automáticamente */
  public readonly autoplay = input<boolean>(true);

  /** Ancho CSS del contenedor */
  public readonly width = input<string>('100%');

  /** Alto CSS del contenedor */
  public readonly height = input<string>('100%');

  /** Etiqueta accesible para lectores de pantalla */
  public readonly ariaLabel = input<string>('Animación gráfica interactiva');

  /** Velocidad de reproducción (1 = normal) */
  public readonly speed = input<number>(1);

  // ── Estado reactivo derivado ───────────────────────────────────────────────
  private readonly resolvedAnimationData = computed(() => {
    const presetName = this.name();
    if (presetName && LOTTIE_PRESETS[presetName]) {
      return LOTTIE_PRESETS[presetName];
    }
    return this.animationData();
  });

  constructor() {
    // Inicialización segura para SSR: solo se ejecuta en el navegador cuando el DOM está listo
    afterNextRender(async () => {
      if (!isPlatformBrowser(this.platformId)) return;

      const containerEl = this.container()?.nativeElement;
      if (!containerEl) return;

      // Polyfill defensivo para entornos de testing headless (JSDOM) donde canvas 2D no está implementado
      if (typeof window !== 'undefined' && typeof HTMLCanvasElement !== 'undefined') {
        const dummyCanvas = document.createElement('canvas');
        if (!dummyCanvas.getContext || !dummyCanvas.getContext('2d')) {
          HTMLCanvasElement.prototype.getContext = function () {
            return {
              fillStyle: '',
              fillRect: () => {},
              clearRect: () => {},
              getImageData: () => ({ data: new Array(4) }),
              measureText: () => ({ width: 0 }),
            } as unknown as RenderingContext;
          } as unknown as typeof HTMLCanvasElement.prototype.getContext;
        }
      }

      try {
        // Carga dinámica de lottie-web para optimizar el bundle inicial
        const lottieModule = await import('lottie-web');
        const lottie = lottieModule.default ?? lottieModule;

        // Limpiar instancia previa si existiera
        this.destroyAnimation();

        const data = this.resolvedAnimationData();
        const animationPath = this.path();

        if (!data && !animationPath) return;

        this.animationItem = lottie.loadAnimation({
          container: containerEl,
          renderer: 'svg',
          loop: this.loop(),
          autoplay: this.autoplay(),
          animationData: data ?? undefined,
          path: animationPath ?? undefined,
        });

        if (this.speed() !== 1) {
          this.animationItem.setSpeed(this.speed());
        }
      } catch (error) {
        console.warn('[LottieComponent] No se pudo inicializar la animación:', error);
      }
    });

    // Limpieza de memoria al destruir el componente
    this.destroyRef.onDestroy(() => {
      this.destroyAnimation();
    });
  }

  /**
   * Pausar animación manualmente
   */
  public pause(): void {
    this.animationItem?.pause();
  }

  /**
   * Reanudar animación manualmente
   */
  public play(): void {
    this.animationItem?.play();
  }

  /**
   * Detener animación
   */
  public stop(): void {
    this.animationItem?.stop();
  }

  private destroyAnimation(): void {
    if (this.animationItem) {
      this.animationItem.destroy();
      this.animationItem = null;
    }
  }
}
