import { LottieComponent } from './lottie.component';
import { LOTTIE_PRESETS } from './lottie-presets';

describe('LottieComponent & Presets', () => {
  it('debe tener definidos los 4 presets requeridos para DiscerIA', () => {
    expect(LOTTIE_PRESETS['ai-thinking']).toBeDefined();
    expect(LOTTIE_PRESETS['success']).toBeDefined();
    expect(LOTTIE_PRESETS['loading']).toBeDefined();
    expect(LOTTIE_PRESETS['empty-library']).toBeDefined();
  });

  it('debe contener capas y propiedades Lottie válidas en ai-thinking', () => {
    const aiPreset = LOTTIE_PRESETS['ai-thinking'] as { v: string; layers: unknown[] };
    expect(aiPreset.v).toBe('5.7.4');
    expect(aiPreset.layers.length).toBeGreaterThan(0);
  });

  it('debe contener capas y propiedades Lottie válidas en success', () => {
    const successPreset = LOTTIE_PRESETS['success'] as { v: string; layers: unknown[] };
    expect(successPreset.v).toBe('5.7.4');
    expect(successPreset.layers.length).toBeGreaterThan(0);
  });
});
