import { AfterViewInit, Directive, ElementRef, OnDestroy, inject, output } from '@angular/core';

@Directive({ selector: '[appDialogFocus]', host: { '(keydown)': 'onKeydown($event)', tabindex: '-1' } })
export class DialogFocusDirective implements AfterViewInit, OnDestroy {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private previous: HTMLElement | null = null;
  readonly dismissed = output<void>();
  ngAfterViewInit(): void {
    this.previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.element.querySelector<HTMLElement>('button, input, textarea, select, a[href]')?.focus();
  }
  ngOnDestroy(): void { if (this.previous?.isConnected) this.previous.focus(); }
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') { event.preventDefault(); this.dismissed.emit(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...this.element.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], summary')]
      .filter((control) => control.getClientRects().length > 0);
    const first = controls[0], last = controls.at(-1);
    if (!first) { event.preventDefault(); this.element.focus(); }
    else if (event.shiftKey && (document.activeElement === first || document.activeElement === this.element)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
}
