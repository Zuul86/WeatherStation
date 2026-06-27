import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WeatherReading } from '../../models/weather-reading.model';
import { WeatherService } from '../../services/weather.service';
import { ReadingCardComponent } from '../reading-card/reading-card.component';
import { ReadingsTableComponent } from '../readings-table/readings-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReadingCardComponent, ReadingsTableComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  readings: WeatherReading[] = [];
  latestReading: WeatherReading | null = null;
  selectedDevice: string | null = null;
  devices: string[] = [];
  isRefreshing = false;
  private destroy$ = new Subject<void>();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly weatherService: WeatherService) {}

  ngOnInit(): void {
    this.loadReadings();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    this.loadReadings();
  }

  onDeviceChange(device: string | null): void {
    this.selectedDevice = device;
  }

  private loadReadings(): void {
    this.isRefreshing = true;
    this.weatherService
      .getLatestReadings(12)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (readings) => {
          this.readings = readings;
          this.latestReading = readings[0] ?? null;
          this.devices = Array.from(new Set(readings.map((reading) => reading.deviceId).filter((device): device is string => !!device)));
          this.isRefreshing = false;
        },
        error: () => {
          this.isRefreshing = false;
        },
      });
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => this.loadReadings(), 15000);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
