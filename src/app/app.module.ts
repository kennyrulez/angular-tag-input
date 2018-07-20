import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AngularTagInputModule } from 'angular-tag-input';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AngularTagInputModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
