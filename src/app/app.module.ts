import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { TagInputModule } from './tag-input/tag-input.module';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    TagInputModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
