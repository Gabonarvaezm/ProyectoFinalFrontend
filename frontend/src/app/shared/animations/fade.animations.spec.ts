import '@angular/compiler';
import {
  collapseExpand,
  fadeInOut,
  fadeInUp,
  scaleInOut,
  staggerFadeIn,
} from './fade.animations';

describe('Shared Angular Animations', () => {
  it('debe definir el trigger fadeInOut', () => {
    expect(fadeInOut.name).toBe('fadeInOut');
  });

  it('debe definir el trigger fadeInUp', () => {
    expect(fadeInUp.name).toBe('fadeInUp');
  });

  it('debe definir el trigger scaleInOut', () => {
    expect(scaleInOut.name).toBe('scaleInOut');
  });

  it('debe definir el trigger staggerFadeIn', () => {
    expect(staggerFadeIn.name).toBe('staggerFadeIn');
  });

  it('debe definir el trigger collapseExpand', () => {
    expect(collapseExpand.name).toBe('collapseExpand');
  });
});
