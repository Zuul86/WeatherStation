import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

/* import AmplifyUIAngularModule  */
import { AmplifyUIAngularModule } from '@aws-amplify/ui-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { SensorDataComponent } from './sensor-data/sensor-data.component'  

@NgModule({
  declarations: [
    AppComponent,
    SensorDataComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    /* configure app with AmplifyUIAngularModule */
    AmplifyUIAngularModule,
    BrowserAnimationsModule,
    MatTableModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }