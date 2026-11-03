import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ArcElement, Chart, DoughnutController, Legend, Plugin, Tooltip } from 'chart.js';
import { BookingService } from '../../core/services/booking.service';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

const FONT = '"Inter", system-ui, sans-serif';

const centerText: Plugin<'doughnut'> = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea || chart.width === 0 || chart.height === 0) return;

    const total = (chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
    const x = (chartArea.left + chartArea.right) / 2;
    const y = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 34px "Poppins", ${FONT}`;
    ctx.fillText(String(total), x, y - 8);
    ctx.fillStyle = 'rgba(255, 255, 255, .6)';
    ctx.font = `500 13px ${FONT}`;
    ctx.fillText('turnos', x, y + 20);
    ctx.restore();
  },
};

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly bookings = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);
  private chart?: Chart<'doughnut'>;

  readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('statusChart');

  readonly loading = signal(true);
  readonly error = signal('');
  readonly counts = signal({ total: 0, pending: 0, confirmed: 0 });

  readonly other = computed(() => {
    const c = this.counts();
    return Math.max(c.total - c.pending - c.confirmed, 0);
  });

  readonly stats = computed(() => {
    const c = this.counts();
    return [
      { label: 'Turnos registrados', value: c.total, description: 'Total de reservas registradas', icon: 'bi-calendar-check', tone: 'info' },
      { label: 'Pendientes', value: c.pending, description: 'Reservas por confirmar', icon: 'bi-clock-history', tone: 'warning' },
      { label: 'Confirmados', value: c.confirmed, description: 'Reservas confirmadas', icon: 'bi-check-circle', tone: 'success' },
    ];
  });

  readonly breakdown = computed(() => {
    const c = this.counts();
    const percent = (n: number) => (c.total ? Math.round((n / c.total) * 100) : 0);
    return [
      { label: 'Pendientes', value: c.pending, percent: percent(c.pending), tone: 'warning' },
      { label: 'Confirmados', value: c.confirmed, percent: percent(c.confirmed), tone: 'success' },
      { label: 'Completados / cancelados', value: this.other(), percent: percent(this.other()), tone: 'secondary' },
    ];
  });

  constructor() {
    effect(() => {
      const canvas = this.canvas()?.nativeElement;
      const c = this.counts();
      const data = [c.pending, c.confirmed, this.other()];

      // Si el canvas desapareció o fue reemplazado, se descarta el gráfico viejo.
      if (this.chart && this.chart.canvas !== canvas) {
        this.chart.destroy();
        this.chart = undefined;
      }

      if (!canvas) return;

      if (this.chart) {
        this.chart.data.datasets[0].data = data;
        this.chart.update();
        return;
      }

      this.chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Pendientes', 'Confirmados', 'Completados / cancelados'],
          datasets: [
            {
              data,
              backgroundColor: ['#fbbf24', '#34d399', '#94a3b8'],
              borderColor: '#0d343c',
              borderWidth: 4,
              borderRadius: 6,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          layout: { padding: 8 },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: 'rgba(255, 255, 255, .75)',
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 18,
                font: { family: FONT, size: 12 },
              },
            },
            tooltip: {
              backgroundColor: '#052f2b',
              titleColor: '#ffffff',
              bodyColor: '#d6ece9',
              padding: 12,
              cornerRadius: 10,
              displayColors: true,
              boxPadding: 4,
            },
          },
        },
        plugins: [centerText],
      });
    });

    this.destroyRef.onDestroy(() => this.chart?.destroy());
  }

  async ngOnInit(): Promise<void> {
    try {
      this.counts.set(await this.bookings.counts());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el resumen.');
    } finally {
      this.loading.set(false);
    }
  }
}