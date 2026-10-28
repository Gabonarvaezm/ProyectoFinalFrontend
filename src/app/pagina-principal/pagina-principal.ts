import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LottieComponent } from '../shared/components/lottie';
import { fadeInUp } from '../shared/animations';

@Component({
  imports: [RouterLink, LottieComponent],
  selector: 'app-pagina-principal',
  styleUrl: './pagina-principal.scss',
  templateUrl: './pagina-principal.html',
  animations: [fadeInUp],
})
export class PaginaPrincipal {}
