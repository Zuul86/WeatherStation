import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorDataComponent } from './sensor-data.component';

describe('SensorDataComponent', () => {
  let component: SensorDataComponent;
  let fixture: ComponentFixture<SensorDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SensorDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SensorDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
