import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID, signal} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TreatmentsService } from '../../../core/services/treatments.service';

interface PublicTreatment {
  name: string;
  description: string;
  benefits: string[];
  image: string;
}
interface CardMotion {
  rotateX: (value: number) => void;
  rotateY: (value: number) => void;
  resetX: (value: number) => void;
  resetY: (value: number) => void;
}

@Component({
  selector: 'app-tratamientos',
  imports: [],
  templateUrl: './tratamientos.html',
  styleUrl: './tratamientos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tratamientos implements OnInit, AfterViewInit, OnDestroy {
  private readonly service = inject(TreatmentsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly treatments = signal<PublicTreatment[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  private animationContext?: gsap.Context;
  private media?: gsap.MatchMedia;

  private readonly cardMotions = new WeakMap<HTMLElement, CardMotion>();

  private viewInitialized = false;
  private animationsInitialized = false;

  async ngOnInit(): Promise<void> {
    try {
      const records = await this.service.listPublic();

      this.treatments.set(records.map((record) => ({
          name: record.name,
          description: record.description,
          benefits: record.benefits ?? [],
          image: record.image_url ?? '',
        })),
      );
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudieron cargar los tratamientos.');
    } finally {
      this.loading.set(false);
      if (this.viewInitialized) {
        this.initializeAnimations();
      }
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    if (!this.loading()) {
      this.initializeAnimations();
    }
  }

  private initializeAnimations(): void {
    if (!isPlatformBrowser(this.platformId) || this.animationsInitialized) {
      return;
    }

    this.animationsInitialized = true;
    this.cdr.detectChanges();

    const section = this.host.nativeElement;
    gsap.registerPlugin(ScrollTrigger);
    const isMobile = window.matchMedia('(max-width: 767.98px)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.animationContext = gsap.context(() => {
      this.media = gsap.matchMedia();

      gsap.to('.treatment-orb--one', { x: 45, y: -35, rotation: 15, duration: 9, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to('.treatment-orb--two', { x: -35, y: 40, rotation: -12, duration: 11, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to('.treatment-orb--three', { x: 55, y: -45, rotation: 18, scale: 1.2, opacity: 1, duration: 8, ease: 'sine.inOut', repeat: -1, yoyo: true });

      if (isMobile) {
        this.initializeMobileAnimations(section, reduceMotion);
        return;
      }

      if (reduceMotion) {
        return;
      }

      gsap.from('.treatments-eyebrow', {
        opacity: 0, y: 30, duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.treatments-header', start: 'top 85%', once: true },
      });

      gsap.from('.treatment-title', {
        opacity: 0, y: 45, duration: 1, delay: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.treatments-header', start: 'top 85%', once: true },
      });

      gsap.from('.treatments-intro', {
        opacity: 0, y: 25, duration: 0.8, delay: 0.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.treatments-header', start: 'top 85%', once: true },
      });

      const cards = gsap.utils.toArray<HTMLElement>('.treatment-card', section);

      gsap.from(cards, {
        opacity: 0,
        y: 100, z: -180,
        rotationX: 18, rotationY: -8,
        scale: 0.88,
        duration: 1.15, stagger: 0.18, ease: 'power3.out',
        clearProps: 'opacity,transform',
        scrollTrigger: { trigger: '.treatments-grid', start: 'top 82%', once: true },
      });

      gsap.utils
        .toArray<HTMLElement>('.treatment-image img', section)
        .forEach((image) => {
          gsap.fromTo(image,
            { yPercent: -5 },
            { yPercent: 5, ease: 'none', scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: 1 } },
          );
        });

      this.media.add('(min-width: 992px) and (hover: hover) and (pointer: fine)',
        () => {
          cards.forEach((card) => {
            gsap.set(card, { transformPerspective: 1100, transformStyle: 'preserve-3d' });
          });
        },
      );
    }, section);
  }

  private initializeMobileAnimations(section: HTMLElement, reduceMotion: boolean): void {
    const columns = gsap.utils.toArray<HTMLElement>('.treatment-column', section);

    columns.forEach((column, index) => {
      const card = column.querySelector<HTMLElement>('.treatment-card');
      const wrapper = column.querySelector<HTMLElement>('.treatment-image');
      const image = wrapper?.querySelector<HTMLImageElement>('img');
      if (!card) { return; }

      gsap.set(column, { transformStyle: 'preserve-3d', transformOrigin: '50% 50%' });

      gsap.set(column, {
        autoAlpha: 0.35,
        y: reduceMotion ? 45 : 85,
        rotationX: reduceMotion ? 7 : 14,
        rotationY: index % 2 === 0 ? -3 : 3,
        scale: reduceMotion ? 0.96 : 0.91,
        transformPerspective: 1000,
        z: reduceMotion ? -25 : -90,
      });

      gsap.to(column, {
        autoAlpha: 1,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: column, start: 'top 92%', end: 'top 48%', scrub: 0.8, invalidateOnRefresh: true },
      });

      if (!wrapper || !image) {
        return;
      }

      gsap.fromTo(
        image,
        { scale: reduceMotion ? 1.12 : 1.22, yPercent: -3 },
        {
          scale: 1.05,
          yPercent: 0,
          ease: 'none',
          scrollTrigger: { trigger: wrapper, start: 'top 92%', end: 'top 48%', scrub: 0.8, invalidateOnRefresh: true },
        },
      );
    });

    ScrollTrigger.refresh();
  }

  onCardPointerMove(event: PointerEvent): void {
    if (!isPlatformBrowser(this.platformId) ||!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    const card = event.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const normalizedX = (x - 0.5) * 2;
    const normalizedY = (y - 0.5) * 2;

    let motion = this.cardMotions.get(card);

    if (!motion) {
      motion = {
        rotateX: gsap.quickTo(card, 'rotationX', { duration: 0.45, ease: 'power3.out' }),
        rotateY: gsap.quickTo(card, 'rotationY', { duration: 0.45, ease: 'power3.out' }),
        resetX: gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: 'elastic.out(1, 0.5)' }),
        resetY: gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: 'elastic.out(1, 0.5)' }),
      };

      this.cardMotions.set(card, motion);
    }
    motion.rotateX(-normalizedY * 9);
    motion.rotateY(normalizedX * 10);
    card.style.setProperty('--pointer-x', `${x * 100}%`);
    card.style.setProperty('--pointer-y', `${y * 100}%`);
  }

  onCardPointerLeave(event: PointerEvent): void {
    const card = event.currentTarget as HTMLElement;
    const motion = this.cardMotions.get(card);
    motion?.resetX(0);
    motion?.resetY(0);
    card.style.setProperty('--pointer-x', '50%');
    card.style.setProperty('--pointer-y', '50%');
  }

  ngOnDestroy(): void {
    this.media?.revert();
    this.animationContext?.revert();
  }
}