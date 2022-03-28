import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherDashboardPageComponent } from './weather-dashboard-page.component';

describe('WeatherDashboardPageComponent', () => {
  let component: WeatherDashboardPageComponent;
  let fixture: ComponentFixture<WeatherDashboardPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WeatherDashboardPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WeatherDashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
