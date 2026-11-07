import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import type { Map as LeafletMap } from 'leaflet';
import { SITE } from '../../../core/site.config';

type LeafletModule = typeof import('leaflet');

@Component({
  selector: 'app-zone',
  imports: [],
  templateUrl: './zone.html',
  styleUrl: './zone.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneSection {
  private readonly leaf = viewChild.required<ElementRef<HTMLDivElement>>('leaf');
  private map?: LeafletMap;
  private destroyed = false;
  protected readonly live = signal(false);
  protected readonly label = SITE.zone.label;

  constructor() {
    afterNextRender(() => void this.initMap());
    inject(DestroyRef).onDestroy(() => { this.destroyed = true; this.map?.remove(); });
  }

  private async initMap(): Promise<void> {
    try {
      const mod = await import('leaflet');
      const L = ((mod as unknown as { default?: LeafletModule }).default ?? mod) as LeafletModule;
      if (this.destroyed) return;

      const { center, radiusMeters, label } = SITE.zone;
      const map = new L.Map(this.leaf().nativeElement, { scrollWheelZoom: false, minZoom: 13, maxZoom: 15 });

      new L.TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const circle = new L.Circle(center, {
        radius: radiusMeters, color: '#0EB0A4', weight: 3, dashArray: '6 6', fillColor: '#0EB0A4', fillOpacity: 0.22,
      }).addTo(map);
      circle.bindTooltip(label, { permanent: true, direction: 'center', className: 'zt' });

      map.fitBounds(circle.getBounds(), { padding: [16, 16] });
      map.setMaxBounds(circle.getBounds().pad(1.2));

      this.map = map;
      this.live.set(true);
    } catch {
    }
  }
}
