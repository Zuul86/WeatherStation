import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';
import { WeatherDataService } from 'src/app/services/weatherdata-api.service';
import { SensorDataComponent } from './sensor-data.component';

describe('SensorDataComponent', () => {
  let component: SensorDataComponent;
  let fixture: ComponentFixture<SensorDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SensorDataComponent],
      imports: [MatTableModule],
      providers: [
        {
          provide: WeatherDataService,
          useValue: {
            ListWeatherData: () => { return of({}); }
          }
        }
      ]
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
