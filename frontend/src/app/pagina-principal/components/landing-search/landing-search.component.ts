import { ChangeDetectionStrategy, Component, model, output } from '@angular/core';

@Component({
  selector: 'app-landing-search',
  standalone: true,
  templateUrl: './landing-search.component.html',
  styleUrl: './landing-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingSearchComponent {
  public readonly searchQuery = model<string>('');
  public readonly searchSubmitted = output<Event>();

  public onFormSubmit(event: Event): void {
    this.searchSubmitted.emit(event);
  }

  public onInput(val: string): void {
    this.searchQuery.set(val);
  }
}

