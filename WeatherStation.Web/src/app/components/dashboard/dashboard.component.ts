import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WeatherReading } from '../../models/weather-reading.model';
import { WeatherService } from '../../services/weather.service';
import { DashboardControlsComponent } from './dashboard-controls.component';
import { ReadingCardComponent } from '../reading-card/reading-card.component';
import { ReadingsTableComponent } from '../readings-table/readings-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardControlsComponent, ReadingCardComponent, ReadingsTableComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  private readonly weatherService = inject(WeatherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly readings = signal<WeatherReading[]>([]);
  readonly totalRecords = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 10;
  readonly isPageLoading = signal(false);
  readonly latestReading = computed(() => this.readings()[0] ?? null);
  readonly selectedDevice = signal<string | null>(null);
  readonly devices = computed(() =>
    Array.from(
      new Set(
        this.readings()
          .map((reading) => reading.deviceId)
          .filter((device): device is string => !!device),
      ),
    ),
  );
  readonly isRefreshing = signal(false);

  constructor() {
    this.loadReadings();
  }

  refresh(): void {
    this.loadReadings();
  }

  onDeviceChange(device: string | null): void {
    this.selectedDevice.set(device);
    this.currentPage.set(1);
    this.loadReadings();
  }

  setPage(page: number): void {
    const nextPage = Math.max(1, page);
    if (nextPage === this.currentPage()) {
      return;
    }

    this.currentPage.set(nextPage);
    this.loadReadings();
  }

  private loadReadings(): void {
    this.isRefreshing.set(true);
    this.isPageLoading.set(true);

    this.weatherService
      .getPaginatedReadings(this.currentPage(), this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items, totalCount, pageNumber }) => {
          this.readings.set(items);
          this.totalRecords.set(totalCount);
          this.currentPage.set(pageNumber);
          this.isRefreshing.set(false);
          this.isPageLoading.set(false);
        },
        error: () => {
          this.isRefreshing.set(false);
          this.isPageLoading.set(false);
        },
      });
  }

}
