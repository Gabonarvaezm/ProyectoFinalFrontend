import {
  animate,
  query,
  stagger,
  style,
  transition,
  trigger,
  AnimationTriggerMetadata,
} from '@angular/animations';

/**
 * Curvas de animación sobrias y elegantes (coherentes con el diseño académico de DiscerIA)
 */
const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * Desvanecimiento simple y fluido para elementos que entran y salen del DOM
 */
export const fadeInOut: AnimationTriggerMetadata = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(`280ms ${EASE_OUT_EXPO}`, style({ opacity: 1 })),
  ]),
  transition(':leave', [
    animate(`200ms ${EASE_IN_OUT}`, style({ opacity: 0 })),
  ]),
]);

/**
 * Entrada elegante con desplazamiento vertical sutil (elevación de 10px)
 */
export const fadeInUp: AnimationTriggerMetadata = trigger('fadeInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(12px)' }),
    animate(
      `340ms ${EASE_OUT_EXPO}`,
      style({ opacity: 1, transform: 'translateY(0)' })
    ),
  ]),
  transition(':leave', [
    animate(
      `220ms ${EASE_IN_OUT}`,
      style({ opacity: 0, transform: 'translateY(6px)' })
    ),
  ]),
]);

/**
 * Entrada y salida para tarjetas interactivas, modales o tooltips con escala suave
 */
export const scaleInOut: AnimationTriggerMetadata = trigger('scaleInOut', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.96)' }),
    animate(
      `300ms ${EASE_OUT_EXPO}`,
      style({ opacity: 1, transform: 'scale(1)' })
    ),
  ]),
  transition(':leave', [
    animate(
      `200ms ${EASE_IN_OUT}`,
      style({ opacity: 0, transform: 'scale(0.97)' })
    ),
  ]),
]);

/**
 * Escalonamiento (Stagger) para listas de libros, mensajes de chat del Tutor IA o resultados
 */
export const staggerFadeIn: AnimationTriggerMetadata = trigger('staggerFadeIn', [
  transition('* => *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        stagger('50ms', [
          animate(
            `300ms ${EASE_OUT_EXPO}`,
            style({ opacity: 1, transform: 'translateY(0)' })
          ),
        ]),
      ],
      { optional: true }
    ),
  ]),
]);

/**
 * Expansión y colapso suave para paneles laterales, filtros o acordeones de texto
 */
export const collapseExpand: AnimationTriggerMetadata = trigger('collapseExpand', [
  transition(':enter', [
    style({ height: 0, opacity: 0, overflow: 'hidden' }),
    animate(
      `320ms ${EASE_OUT_EXPO}`,
      style({ height: '*', opacity: 1 })
    ),
  ]),
  transition(':leave', [
    style({ overflow: 'hidden' }),
    animate(
      `240ms ${EASE_IN_OUT}`,
      style({ height: 0, opacity: 0 })
    ),
  ]),
]);

