import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-controls.component.html',
  styleUrls: ['./dashboard-controls.component.css'],
})
export class DashboardControlsComponent {
  @Input() isRefreshing = false;
  @Input() selectedDevice: string | null = null;
  @Input() devices: string[] = [];
  @Input() latestReadingTimestamp: string | null = null;

  @Output() refresh = new EventEmitter<void>();
  @Output() deviceChange = new EventEmitter<string | null>();

  onDeviceChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.deviceChange.emit(target.value || null);
  }
}
