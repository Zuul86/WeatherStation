import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { WeatherDataService } from 'src/app/services/weatherdata-api.service';
import { WeatherDataModel } from '../../../../models/weather-data.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-sensor-data-table',
  templateUrl: './sensor-data.component.html',
  styleUrls: ['./sensor-data.component.scss']
})
export class SensorDataComponent implements OnDestroy {

  dataSource!: MatTableDataSource<WeatherDataModel>;
  displayedColumns: string[] = ['readingTime', 'sensor_t', 'sensor_h', 'sensor_bp'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @Input() temperatureUnit!: string;
  title = 'Weather Station';

  private weatherDataSubscription: Subscription;

  constructor(private api: WeatherDataService) {
    this.weatherDataSubscription = this.api.ListWeatherData(null, 1000).subscribe(x => {
      this.dataSource = new MatTableDataSource<WeatherDataModel>(x.data);
      this.dataSource.paginator = this.paginator;
    });
  }

  ngOnDestroy() {
    this.weatherDataSubscription.unsubscribe();
  }
}