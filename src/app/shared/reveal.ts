import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/**
 * Aparición suave al entrar en pantalla. `appReveal="0.08"` agrega un retraso en segundos.
 * Respeta `prefers-reduced-motion`.
 */
@Directive({
  selector: '[appReveal]',
  host: { class: 'rv' },
})
export class Reveal {
  readonly appReveal = input(0, { transform: (v: unknown) => Number(v) || 0 });

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.el.style.setProperty('--d', `${this.appReveal()}s`);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || !('IntersectionObserver' in window)) {
        this.el.classList.add('in');
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.el.classList.add('in');
            io.disconnect();
          }
        },
        { threshold: 0.12 },
      );
      io.observe(this.el);
      this.destroyRef.onDestroy(() => io.disconnect());
    });
  }
}
