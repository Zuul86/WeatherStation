import { Component } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  imports: [DashboardComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {}
