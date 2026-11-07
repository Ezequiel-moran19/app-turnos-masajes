import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private animationContext?: gsap.Context;
  private media?: gsap.MatchMedia;

  private rotateXTo?: (value: number) => void;
  private rotateYTo?: (value: number) => void;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    this.animationContext = gsap.context(() => {
      this.media = gsap.matchMedia();

      // Animaciones compartidas: burbujas decorativas.
      gsap.to('.hero-orb--one', {
        y: -35,
        x: 15,
        rotation: 15,
        duration: 7,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      gsap.to('.hero-orb--two', {
        y: 25,
        x: -20,
        rotation: -12,
        duration: 9,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      // Entrada del contenido para todas las resoluciones.
      const intro = gsap.timeline({
        defaults: {
          ease: 'power3.out',
        },
      });

      intro
        .from('.hero-eyebrow', {
          opacity: 0,
          y: 20,
          duration: 0.7,
        })
        .from(
          '.hero-title',
          {
            opacity: 0,
            y: 45,
            duration: 1,
          },
          '-=0.35',
        )
        .from(
          '.hero-description',
          {
            opacity: 0,
            y: 25,
            duration: 0.8,
          },
          '-=0.5',
        )
        .from(
          '.hero-actions',
          {
            opacity: 0,
            y: 20,
            duration: 0.7,
          },
          '-=0.45',
        )
        .from(
          '.hero-chips li',
          {
            opacity: 0,
            y: 15,
            stagger: 0.12,
            duration: 0.5,
          },
          '-=0.4',
        );

      // Escritorio: imagen 3D, badge, parallax e interacción con mouse.
      this.media.add('(min-width: 992px)', () => {
        intro.from(
          '.hero-visual',
          {
            opacity: 0,
            x: 50,
            scale: 0.94,
            duration: 1.1,
          },
          '-=0.8',
        );

        gsap.to('.hero-badge', {
          y: -9,
          duration: 3,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });

        gsap.to('.hero-image', {
          yPercent: 9,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });

        const visual =
          this.host.nativeElement.querySelector<HTMLElement>('.visual');

        if (visual) {
          this.rotateXTo = gsap.quickTo(visual, 'rotationX', {
            duration: 0.6,
            ease: 'power3.out',
          });

          this.rotateYTo = gsap.quickTo(visual, 'rotationY', {
            duration: 0.6,
            ease: 'power3.out',
          });
        }

        return () => {
          this.rotateXTo = undefined;
          this.rotateYTo = undefined;
        };
      });

      // Mobile y tablet: la imagen 3D independiente no participa.
      // El fondo de toda la sección se anima mediante CSS.
      // Mobile y tablet: animación del fondo de toda la sección.
      // Mobile y tablet: movimiento cinematográfico del fondo.
      // Mobile y tablet: movimiento cinematográfico del fondo.
      this.media.add(
        '(max-width: 991.98px) and (prefers-reduced-motion: no-preference)',
        () => {
          gsap.set('.hero-visual', {
            clearProps: 'all',
          });

          gsap.fromTo(
            '.hero',
            {
              '--hero-bg-scale': 1.08,
              '--hero-bg-y': '1%',
            },
            {
              '--hero-bg-scale': 1.2,
              '--hero-bg-y': '-1.5%',
              duration: 12,
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
            },
          );
        },
      );

      // Mobile con movimiento reducido: fondo estático.
      this.media.add(
        '(max-width: 991.98px) and (prefers-reduced-motion: reduce)',
        () => {
          gsap.set('.hero', {
            '--hero-bg-scale': 1.08,
            '--hero-bg-y': '0%',
          });

          gsap.set('.hero-visual', {
            clearProps: 'all',
          });
        },
      );
    }, this.host.nativeElement);
  }

  onPointerMove(event: PointerEvent): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    const visual = this.host.nativeElement.querySelector<HTMLElement>('.visual');

    if (!visual) {
      return;
    }

    const rect = visual.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const normalizedX = (x - 0.5) * 2;
    const normalizedY = (y - 0.5) * 2;
    this.rotateXTo?.(-normalizedY * 6);
    this.rotateYTo?.(normalizedX * 7);
  }

  onPointerLeave(): void {
    this.rotateXTo?.(0);
    this.rotateYTo?.(0);
  }

  ngOnDestroy(): void {
    this.media?.revert();
    this.animationContext?.revert();

    this.rotateXTo = undefined;
    this.rotateYTo = undefined;
  }
}