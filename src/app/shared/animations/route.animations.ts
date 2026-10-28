import {
  animate,
  group,
  query,
  style,
  transition,
  trigger,
  AnimationTriggerMetadata,
} from '@angular/animations';

const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Transición refinada entre rutas principales de la plataforma
 */
export const routeFadeAnimation: AnimationTriggerMetadata = trigger('routeFadeAnimation', [
  transition('* <=> *', [
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
        }),
      ],
      { optional: true }
    ),
    query(':enter', [style({ opacity: 0, transform: 'translateY(8px)' })], {
      optional: true,
    }),
    group([
      query(
        ':leave',
        [animate(`180ms ease-out`, style({ opacity: 0 }))],
        { optional: true }
      ),
      query(
        ':enter',
        [
          animate(
            `300ms 60ms ${EASE_OUT_EXPO}`,
            style({ opacity: 1, transform: 'translateY(0)' })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),
]);

