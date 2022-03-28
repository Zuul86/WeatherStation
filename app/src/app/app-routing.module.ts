import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { WeatherDashboardPageComponent } from './pages/weather-dashboard-page/weather-dashboard-page.component';

const routes: Routes = [
  {
    path: '',
    component: WeatherDashboardPageComponent
  },
  {
    path: 'login',
    component: LoginPageComponent
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
