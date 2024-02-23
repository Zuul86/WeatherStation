import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { ApolloLink, InMemoryCache } from '@apollo/client/core';

import { SensorDataComponent } from './features/weather-data-table/components/sensor-data/sensor-data.component';
import { ConvertTemperaturePipe } from './features/weather-data-table/pipes/convert-temperature.pipe';
import { WeatherDashboardPageComponent } from './pages/weather-dashboard-page/weather-dashboard-page.component';
import { MenuComponent } from './features/menu/menu.component';
import { environment } from 'src/environments/environment';
import { AppSettingsState } from './state/app-settings.state';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { MatDialogModule } from '@angular/material/dialog';

import { OktaAuthModule, OKTA_CONFIG } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';
import { LoginButtonComponent } from './features/login-button/login-button.component';
import { ProfileComponent } from './features/profile/profile.component';
import { MatPaginatorModule } from '@angular/material/paginator';

const oktaAuth = new OktaAuth({
  issuer: 'https://dev-68348927.okta.com/oauth2/default',
  clientId: '0oa5nhakmyDFhh9w15d7',
  redirectUri: window.location.origin + '/login/callback'
});

@NgModule({
  declarations: [
    AppComponent,
    SensorDataComponent,
    ConvertTemperaturePipe,
    WeatherDashboardPageComponent,
    MenuComponent,
    LoginButtonComponent,
    ProfileComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatDividerModule,
    MatDialogModule,
    MatButtonToggleModule,
    ApolloModule,
    HttpClientModule,
    NgxsModule.forRoot([AppSettingsState], { developmentMode: !environment.production }),
    NgxsReduxDevtoolsPluginModule.forRoot(),
    OktaAuthModule,
    MatPaginatorModule
  ],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink) => {
        const http = httpLink.create({
          uri: 'https://vv6w2uq4ojcw7ocbjl4btm5spa.appsync-api.us-west-2.amazonaws.com/graphql',
        })

        const middleware = new ApolloLink((operation, forward) => {
          operation.setContext({
            headers: new HttpHeaders().set(
              'x-api-key',
              'da2-2t2qmdxejjcsxlq7gwjnxtuxk4',
            ),
          });
          return forward(operation);
        });

        const link = middleware.concat(http);

        return {
          link,
          cache: new InMemoryCache(),
        };
      },
      deps: [HttpLink],
    },
    {
      provide: OKTA_CONFIG,
      useValue: { oktaAuth }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }