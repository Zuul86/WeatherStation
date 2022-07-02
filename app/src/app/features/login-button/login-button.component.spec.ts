import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxsModule } from '@ngxs/store';
import { OktaAuthModule, OktaAuthStateService, OKTA_CONFIG } from '@okta/okta-angular';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { LoginButtonComponent } from './login-button.component';
import { EMPTY } from 'rxjs';

describe('LoginButtonComponent', () => {
  let component: LoginButtonComponent;
  let fixture: ComponentFixture<LoginButtonComponent>;

  const oktaConfig = {
    issuer: 'https://not-real.okta.com',
    clientId: 'fake-client-id',
    redirectUri: 'http://localhost:4200'
  };
  let oktaAuthSpy = jasmine.createSpyObj('OktaAuth', ['signInWithRedirect', 'signOut']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginButtonComponent,],
      imports: [
        NgxsModule,
        RouterTestingModule,
        ApolloTestingModule,
        OktaAuthModule
      ],
      providers: [
        {
          provide: OktaAuthStateService,
          useValue: {
            authState$: EMPTY
          }
        },
        {
          provide: OKTA_CONFIG,
          useValue: oktaConfig
        },
        {
          provide: OktaAuthModule,
          useValue: { oktaAuthSpy }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
