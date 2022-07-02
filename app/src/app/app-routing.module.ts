import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { WeatherDashboardPageComponent } from './pages/weather-dashboard-page/weather-dashboard-page.component';
import { OktaCallbackComponent } from '@okta/okta-angular';

const routes: Routes = [
  {
    path: '',
    component: WeatherDashboardPageComponent
  },
  {
    path: 'login/callback',
    component: OktaCallbackComponent
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
