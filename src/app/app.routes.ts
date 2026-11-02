import { Routes } from '@angular/router';
import { Home } from './public/home/home';
import { MyBooking } from './public/my-booking/my-booking';
import { Login } from './admin/login/login';
import { Layout } from './admin/layout/layout';
import { Dashboard } from './admin/dashboard/dashboard';
import { Bookings } from './admin/bookings/bookings';
import { Schedule } from './admin/schedule/schedule';
import { Treatments } from './admin/treatments/treatments';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'mi-turno/:token', component: MyBooking },
  { path: 'admin/login', component: Login },
  { path: 'admin', component: Layout, canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'bookings', component: Bookings },
      { path: 'schedule', component: Schedule },
      { path: 'treatments', component: Treatments },
    ],
  },
  { path: '**', redirectTo: ''},
];