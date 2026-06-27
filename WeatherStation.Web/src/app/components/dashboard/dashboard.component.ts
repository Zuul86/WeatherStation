import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
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
export class DashboardComponent {
  private readonly weatherService = inject(WeatherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly readings = signal<WeatherReading[]>([]);
  readonly latestReading = computed(() => this.readings()[0] ?? null);
  readonly selectedDevice = signal<string | null>(null);
  readonly devices = signal<string[]>([]);
  readonly isRefreshing = signal(false);

  constructor() {
    this.loadReadings();
    this.startAutoRefresh();
  }

  refresh(): void {
    this.loadReadings();
  }

  onDeviceChange(device: string | null): void {
    this.selectedDevice.set(device);
  }

  private loadReadings(): void {
    this.isRefreshing.set(true);

    this.weatherService
      .getLatestReadings(12)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (readings) => {
          this.readings.set(readings);
          this.devices.set(
            Array.from(
              new Set(
                readings
                  .map((reading) => reading.deviceId)
                  .filter((device): device is string => !!device),
              ),
            ),
          );
          this.isRefreshing.set(false);
        },
        error: () => {
          this.isRefreshing.set(false);
        },
      });
  }

  private startAutoRefresh(): void {
    interval(15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadReadings());
  }
}
