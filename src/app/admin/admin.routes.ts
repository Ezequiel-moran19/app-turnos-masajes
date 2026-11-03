import { Routes } from '@angular/router';
import { adminGuard } from '../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./layout/layout').then(m => m.Layout),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./bookings/bookings').then(m => m.Bookings),
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./schedule/schedule').then(m => m.Schedule),
      },
      {
        path: 'treatments',
        loadComponent: () =>
          import('./treatments/treatments').then(m => m.Treatments),
      },
    ],
  },
];
