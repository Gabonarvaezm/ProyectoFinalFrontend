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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
