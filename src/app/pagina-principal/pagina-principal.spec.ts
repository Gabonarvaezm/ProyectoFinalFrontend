import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PaginaPrincipal } from './pagina-principal';

describe('PaginaPrincipal', () => {
  let component: PaginaPrincipal;
  let fixture: ComponentFixture<PaginaPrincipal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaPrincipal],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginaPrincipal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
