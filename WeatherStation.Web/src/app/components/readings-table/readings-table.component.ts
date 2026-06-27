import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WeatherReading } from '../../models/weather-reading.model';

@Component({
  selector: 'app-readings-table',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './readings-table.component.html',
  styleUrl: './readings-table.component.css',
})
export class ReadingsTableComponent {
  @Input() readings: WeatherReading[] = [];
  @Input() selectedDevice: string | null = null;

  sortColumn: keyof WeatherReading | 'timestamp' = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(private readonly datePipe: DatePipe) {}

  get visibleReadings(): WeatherReading[] {
    const filtered = this.selectedDevice
      ? this.readings.filter((reading) => reading.deviceId === this.selectedDevice)
      : this.readings;

    return [...filtered].sort((left, right) => {
      const leftValue = left[this.sortColumn as keyof WeatherReading];
      const rightValue = right[this.sortColumn as keyof WeatherReading];
      const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  toggleSort(column: keyof WeatherReading | 'timestamp'): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      return;
    }

    this.sortColumn = column;
    this.sortDirection = 'desc';
  }

  formatTimestamp(value: string): string {
    const parsed = new Date(value);
    return this.datePipe.transform(parsed, 'MMM d, yyyy HH:mm') ?? value;
  }
}
