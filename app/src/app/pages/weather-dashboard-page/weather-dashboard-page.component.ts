import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-weather-dashboard-page',
  templateUrl: './weather-dashboard-page.component.html',
  styleUrls: ['./weather-dashboard-page.component.scss']
})
export class WeatherDashboardPageComponent implements OnInit {

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {

  }

}
