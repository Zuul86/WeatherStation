import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-reading-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reading-card.component.html',
  styleUrl: './reading-card.component.css',
})
export class ReadingCardComponent {
  @Input() label = 'Metric';
  @Input() value: number | null = null;
  @Input() unit = '';
  @Input() icon = '📊';
  @Input() kind: 'temperature' | 'humidity' | 'pressure' | 'pm1_0' | 'pm2_5' | 'pm10_0' | string = 'temperature';

  get displayValue(): string {
    if (this.value == null || Number.isNaN(this.value)) {
      return '--';
    }

    switch (this.kind) {
      case 'temperature':
        return this.value.toFixed(1);
      case 'humidity':
        return this.value.toFixed(0);
      case 'pressure':
        return this.value.toFixed(0);
      case 'pm1_0':
      case 'pm2_5':
      case 'pm10_0':
        return this.value.toFixed(0);
      default:
        return this.value.toString();
    }
  }

  get accentClass(): string {
    return `metric-card--${this.kind}`;
  }
}
