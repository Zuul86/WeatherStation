import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
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
  readonly pageSize = 10;
  readonly pageNumber = signal(1);
  readonly totalRecords = signal(0);
  readonly sortColumn = signal<keyof WeatherReading>('timestamp');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  @Input() loading = false;

  @Input() set readings(value: WeatherReading[]) {
    this.readingsSignal.set(value ?? []);
  }

  @Input() set selectedDevice(value: string | null) {
    this.selectedDeviceSignal.set(value);
  }

  @Input() set pageNumberValue(value: number) {
    this.pageNumber.set(Math.max(1, value));
  }

  @Input() set totalCount(value: number) {
    this.totalRecords.set(Math.max(0, value));
  }

  @Output() pageChange = new EventEmitter<number>();

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.totalRecords() / this.pageSize)));
  readonly pageNumbers = computed(() => {
    const totalPages = this.pageCount();
    const currentPage = this.pageNumber();
    const pages = new Set<number>();

    for (let page = 1; page <= totalPages; page++) {
      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
        pages.add(page);
      }
    }

    return Array.from(pages).sort((left, right) => left - right);
  });
  readonly rangeStart = computed(() => Math.min((this.pageNumber() - 1) * this.pageSize + 1, this.totalRecords()));
  readonly rangeEnd = computed(() => Math.min(this.pageNumber() * this.pageSize, this.totalRecords()));
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

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageChange.emit(this.pageNumber() - 1);
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.pageCount()) {
      this.pageChange.emit(this.pageNumber() + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pageCount() && page !== this.pageNumber()) {
      this.pageChange.emit(page);
    }
  }

  formatTimestamp(value: string): string {
    const parsed = new Date(value);
    return this.datePipe.transform(parsed, 'MMM d, yyyy h:mm:ss a z', 'America/Chicago') ?? value;
  }
}
