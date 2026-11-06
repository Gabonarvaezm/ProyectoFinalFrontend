import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fadeInUp } from '../shared/animations';
import { Course, Testimonial } from './models/landing.model';
import { FEATURED_COURSES, TESTIMONIALS_DATA } from './data/landing.data';
import {
  LandingNavbarComponent,
  LandingHeroComponent,
  LandingPartnersComponent,
  LandingSearchComponent,
  LandingBenefitsComponent,
  LandingCoursesComponent,
  LandingDocentesComponent,
  LandingTestimonialsComponent,
  LandingFooterComponent,
} from './components';

export type { Course, Testimonial };

@Component({
  selector: 'app-pagina-principal',
  standalone: true,
  imports: [
    LandingNavbarComponent,
    LandingHeroComponent,
    LandingPartnersComponent,
    LandingSearchComponent,
    LandingBenefitsComponent,
    LandingCoursesComponent,
    LandingDocentesComponent,
    LandingTestimonialsComponent,
    LandingFooterComponent,
  ],
  styleUrl: './pagina-principal.scss',
  templateUrl: './pagina-principal.html',
  animations: [fadeInUp],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaPrincipal {
  /** Control del menú móvil responsive */
  public readonly mobileMenuOpen = signal<boolean>(false);

  /** Valor de búsqueda en la biblioteca virtual */
  public readonly searchQuery = signal<string>('');

  /** Paginación del carrusel de testimonios */
  public readonly currentTestimonialPage = signal<number>(1);
  public readonly totalTestimonialPages = 15;

  /** Colecciones y recursos destacados de la biblioteca virtual */
  public readonly courses = signal<readonly Course[]>(FEATURED_COURSES);

  /** Testimonios de docentes y estudiantes de instituciones públicas */
  public readonly testimonials = signal<readonly Testimonial[]>(TESTIMONIALS_DATA);

  /** Alternar visualización del menú en móvil */
  public toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  /** Cerrar menú móvil al navegar */
  public closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /** Manejar búsqueda en la biblioteca */
  public onSearch(event: Event): void {
    event.preventDefault();
  }

  /** Página previa de testimonios */
  public prevTestimonial(): void {
    this.currentTestimonialPage.update((p) =>
      p > 1 ? p - 1 : this.totalTestimonialPages
    );
  }

  /** Página siguiente de testimonios */
  public nextTestimonial(): void {
    this.currentTestimonialPage.update((p) =>
      p < this.totalTestimonialPages ? p + 1 : 1
    );
  }
}
