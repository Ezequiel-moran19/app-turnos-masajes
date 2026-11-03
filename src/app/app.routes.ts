import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./public/home/home').then(m => m.Home),
  },
  {
    path: 'mi-turno/:token',
    loadComponent: () => import('./public/my-booking/my-booking').then(m => m.MyBooking),
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login/login').then(m => m.Login),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
