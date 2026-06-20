import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { WeatherDashboardPageComponent } from './pages/weather-dashboard-page/weather-dashboard-page.component';

const routes: Routes = [
  {
    path: '',
    component: WeatherDashboardPageComponent
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
