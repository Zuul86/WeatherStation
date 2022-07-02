import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { WeatherDataService } from 'src/app/services/weatherdata-api.service';
import { SensorDataComponent } from './sensor-data.component';

describe('SensorDataComponent', () => {
  let component: SensorDataComponent;
  let fixture: ComponentFixture<SensorDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SensorDataComponent],
      imports: [
        NoopAnimationsModule,
        MatTableModule,
        MatPaginatorModule
      ],
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
