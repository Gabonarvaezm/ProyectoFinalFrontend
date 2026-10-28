/**
 * Tipo de presets de animación integrados para la plataforma DiscerIA
 */
export type LottiePreset = 'ai-thinking' | 'success' | 'loading' | 'empty-library';

/**
 * Animaciones Lottie vectoriales optimizadas, autocontenidas y sin dependencias externas
 */
export const LOTTIE_PRESETS: Record<LottiePreset, object> = {
  // ── 1. Tutor IA Pensando / Procesando (Ondas concéntricas de pulso neuronal) ──
  'ai-thinking': {
    v: '5.7.4',
    fr: 60,
    ip: 0,
    op: 120,
    w: 200,
    h: 200,
    nm: 'ai-thinking',
    ddd: 0,
    assets: [],
    layers: [
      // Nodo central brillante
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Center Node',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] }, o: { x: [0.2, 0.2, 0.2], y: [0, 0, 0] }, t: 0, s: [90, 90, 100] },
              { i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] }, o: { x: [0.2, 0.2, 0.2], y: [0, 0, 0] }, t: 60, s: [115, 115, 100] },
              { t: 120, s: [90, 90, 100] }
            ]
          }
        },
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                s: { a: 0, k: [36, 36] },
                p: { a: 0, k: [0, 0] }
              },
              {
                ty: 'fl',
                c: { a: 0, k: [0.388, 0.4, 0.945, 1] }, // Indigo AI #6366f1
                o: { a: 0, k: 100 },
                r: 1
              },
              {
                ty: 'tr',
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ]
      },
      // Onda expansiva 1
      {
        ddd: 0,
        ind: 2,
        ty: 4,
        nm: 'Wave 1',
        sr: 1,
        ks: {
          o: {
            a: 1,
            k: [
              { t: 0, s: [90] },
              { t: 90, s: [0] }
            ]
          },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { t: 0, s: [40, 40, 100] },
              { t: 90, s: [140, 140, 100] }
            ]
          }
        },
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                s: { a: 0, k: [50, 50] },
                p: { a: 0, k: [0, 0] }
              },
              {
                ty: 'st',
                c: { a: 0, k: [0.145, 0.388, 0.921, 1] }, // Blue #2563eb
                o: { a: 0, k: 80 },
                w: { a: 0, k: 3 }
              },
              {
                ty: 'tr',
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ]
      },
      // Onda expansiva 2
      {
        ddd: 0,
        ind: 3,
        ty: 4,
        nm: 'Wave 2',
        sr: 1,
        ks: {
          o: {
            a: 1,
            k: [
              { t: 30, s: [80] },
              { t: 120, s: [0] }
            ]
          },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { t: 30, s: [40, 40, 100] },
              { t: 120, s: [160, 160, 100] }
            ]
          }
        },
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                s: { a: 0, k: [50, 50] },
                p: { a: 0, k: [0, 0] }
              },
              {
                ty: 'st',
                c: { a: 0, k: [0.545, 0.36, 0.965, 1] }, // Violet #8b5cf6
                o: { a: 0, k: 70 },
                w: { a: 0, k: 2.5 }
              },
              {
                ty: 'tr',
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 2. Éxito / Confirmación (Checkmark verde esmeralda con trazado animado) ─
  'success': {
    v: '5.7.4',
    fr: 60,
    ip: 0,
    op: 80,
    w: 120,
    h: 120,
    nm: 'success-badge',
    ddd: 0,
    assets: [],
    layers: [
      // Checkmark trazado
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Checkmark',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [60, 60, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                ty: 'sh',
                ks: {
                  a: 0,
                  k: {
                    c: false,
                    i: [[0, 0], [0, 0], [0, 0]],
                    o: [[0, 0], [0, 0], [0, 0]],
                    v: [[-18, 2], [-6, 14], [18, -12]]
                  }
                }
              },
              {
                ty: 'tm',
                s: { a: 0, k: 0 },
                e: {
                  a: 1,
                  k: [
                    { t: 15, s: [0] },
                    { t: 45, s: [100] }
                  ]
                },
                o: { a: 0, k: 0 }
              },
              {
                ty: 'st',
                c: { a: 0, k: [1, 1, 1, 1] },
                o: { a: 0, k: 100 },
                w: { a: 0, k: 5 },
                lc: 2,
                lj: 2
              },
              {
                ty: 'tr',
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ]
      },
      // Círculo de Fondo animado con escala elástica
      {
        ddd: 0,
        ind: 2,
        ty: 4,
        nm: 'Circle Background',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [60, 60, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { t: 0, s: [0, 0, 100] },
              { t: 20, s: [110, 110, 100] },
              { t: 30, s: [100, 100, 100] }
            ]
          }
        },
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                s: { a: 0, k: [76, 76] },
                p: { a: 0, k: [0, 0] }
              },
              {
                ty: 'fl',
                c: { a: 0, k: [0.063, 0.725, 0.506, 1] }, // Emerald #10b981
                o: { a: 0, k: 100 },
                r: 1
              },
              {
                ty: 'tr',
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 3. Spinner de Carga Sofisticado ─────────────────────────────────────────
  'loading': {
    v: '5.7.4',
    fr: 60,
    ip: 0,
    op: 90,
    w: 80,
    h: 80,
    nm: 'loading-spinner',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Ring',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: {
            a: 1,
            k: [
              { t: 0, s: [0] },
              { t: 90, s: [360] }
            ]
          },
          p: { a: 0, k: [40, 40, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                d: 1,
                ty: 'el',
                s: { a: 0, k: [48, 48] },
                p: { a: 0, k: [0, 0] }
              },
              {
                ty: 'tm',
                s: { a: 0, k: 0 },
                e: {
                  a: 1,
                  k: [
                    { t: 0, s: [10] },
                    { t: 45, s: [75] },
                    { t: 90, s: [10] }
                  ]
                },
                o: { a: 0, k: 0 }
              },
              {
                ty: 'st',
                c: { a: 0, k: [0.145, 0.388, 0.921, 1] }, // Blue #2563eb
                o: { a: 0, k: 100 },
                w: { a: 0, k: 4.5 },
                lc: 2
              },
              {
                ty: 'tr',
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ]
      }
    ]
  },

  // ── 4. Estado Vacío / Biblioteca Digital ───────────────────────────────────
  'empty-library': {
    v: '5.7.4',
    fr: 60,
    ip: 0,
    op: 120,
    w: 160,
    h: 160,
    nm: 'empty-library-book',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Floating Book',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: {
            a: 1,
            k: [
              { t: 0, s: [80, 80, 0] },
              { t: 60, s: [80, 72, 0] },
              { t: 120, s: [80, 80, 0] }
            ]
          },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                ty: 'rc',
                s: { a: 0, k: [60, 44] },
                p: { a: 0, k: [0, 0] },
                r: { a: 0, k: 6 }
              },
              {
                ty: 'st',
                c: { a: 0, k: [0.388, 0.4, 0.945, 1] },
                o: { a: 0, k: 100 },
                w: { a: 0, k: 3 }
              },
              {
                ty: 'fl',
                c: { a: 0, k: [0.937, 0.953, 0.996, 1] },
                o: { a: 0, k: 100 },
                r: 1
              },
              {
                ty: 'tr',
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ]
      }
    ]
  }
};

