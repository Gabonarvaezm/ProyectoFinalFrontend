import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { PaginaPrincipal } from './pagina-principal';

describe('PaginaPrincipal', () => {
  let component: PaginaPrincipal;
  let fixture: ComponentFixture<PaginaPrincipal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaPrincipal],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginaPrincipal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default states and values', () => {
    expect(component.mobileMenuOpen()).toBe(false);
    expect(component.searchQuery()).toBe('');
    expect(component.currentTestimonialPage()).toBe(1);
    expect(component.courses().length).toBe(3);
    expect(component.testimonials().length).toBe(3);
  });

  it('should toggle mobile menu open and closed', () => {
    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBe(true);

    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBe(false);
  });

  it('should close mobile menu explicitly with closeMobileMenu()', () => {
    component.mobileMenuOpen.set(true);
    expect(component.mobileMenuOpen()).toBe(true);

    component.closeMobileMenu();
    expect(component.mobileMenuOpen()).toBe(false);
  });

  it('should paginate testimonials forward and wrap around at max page', () => {
    expect(component.currentTestimonialPage()).toBe(1);

    component.nextTestimonial();
    expect(component.currentTestimonialPage()).toBe(2);

    component.currentTestimonialPage.set(15);
    component.nextTestimonial();
    expect(component.currentTestimonialPage()).toBe(1);
  });

  it('should paginate testimonials backward and wrap around at min page', () => {
    expect(component.currentTestimonialPage()).toBe(1);

    component.prevTestimonial();
    expect(component.currentTestimonialPage()).toBe(15);

    component.prevTestimonial();
    expect(component.currentTestimonialPage()).toBe(14);
  });

  it('should prevent default on search submission', () => {
    const fakeEvent = { preventDefault: vi.fn() } as unknown as Event;
    component.onSearch(fakeEvent);
    expect(fakeEvent.preventDefault).toHaveBeenCalled();
  });

  it('should render the brand title and hero headline in DOM', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const heroTitle = compiled.querySelector('.hero-title');
    expect(heroTitle?.textContent).toContain('Biblioteca Virtual');

    const brand = compiled.querySelector('.brand-logo');
    expect(brand?.textContent).toContain('DiscerIA');
  });

  it('should render 3 popular course cards', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.course-card');
    expect(cards.length).toBe(3);
  });

  it('should render 3 student review cards', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const reviewCards = compiled.querySelectorAll('.testimonial-card');
    expect(reviewCards.length).toBe(3);
  });
});
