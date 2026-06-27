import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';
import { WeatherReading } from '../../models/weather-reading.model';

@Component({
  selector: 'app-readings-table',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './readings-table.component.html',
  styleUrls: ['./readings-table.component.css'],
})
export class ReadingsTableComponent {
  private readonly readingsSignal = signal<WeatherReading[]>([]);
  private readonly selectedDeviceSignal = signal<string | null>(null);
  readonly sortColumn = signal<keyof WeatherReading>('timestamp');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  @Input() set readings(value: WeatherReading[]) {
    this.readingsSignal.set(value ?? []);
  }

  @Input() set selectedDevice(value: string | null) {
    this.selectedDeviceSignal.set(value);
  }

  readonly visibleReadings = computed(() => {
    const filtered = this.selectedDeviceSignal()
      ? this.readingsSignal().filter((reading) => reading.deviceId === this.selectedDeviceSignal())
      : this.readingsSignal();

    return [...filtered].sort((left, right) => {
      const leftValue = left[this.sortColumn()];
      const rightValue = right[this.sortColumn()];
      const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));

      return this.sortDirection() === 'asc' ? comparison : -comparison;
    });
  });

  constructor(private readonly datePipe: DatePipe) {}

  toggleSort(column: keyof WeatherReading): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
      return;
    }

    this.sortColumn.set(column);
    this.sortDirection.set('desc');
  }

  formatTimestamp(value: string): string {
    const parsed = new Date(value);
    return this.datePipe.transform(parsed, 'MMM d, yyyy HH:mm') ?? value;
  }
}
