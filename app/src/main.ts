import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import Amplify from "aws-amplify";
import aws_exports from "./aws-exports";

if (environment.production) {
  enableProdMode();
}

Amplify.configure(aws_exports);

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
