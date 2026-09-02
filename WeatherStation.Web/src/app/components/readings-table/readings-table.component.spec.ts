import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ReadingsTableComponent } from './readings-table.component';

describe('ReadingsTableComponent', () => {
  let fixture: ComponentFixture<ReadingsTableComponent>;
  let component: ReadingsTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadingsTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReadingsTableComponent);
    component = fixture.componentInstance;
  });

  it('shows a 10-item page and the total record count', () => {
    component.pageSize = 10;
    component.pageNumber = 1;
    component.totalRecords = 25;
    component.readings = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      timestamp: new Date(Date.now() - index * 60000).toISOString(),
      temperatureFahrenheit: 70 + index,
      humidity: 40 + index,
      pressure: 1010 + index,
      deviceId: index % 3 === 0 ? 'A' : 'B',
    }));

    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(10);
    expect(component.totalRecords).toBe(25);
    expect(component.pageCount).toBe(3);
  });
});
