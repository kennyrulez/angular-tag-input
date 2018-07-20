import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AngularTagInputComponent } from './angular-tag-input.component';
import { TagInputItemComponent } from './tag-input-item/tag-input-item.component';
import { TagInputAutocompleteComponent } from './tag-input-autocomplete/tag-input-autocomplete.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [
    AngularTagInputComponent,
    TagInputItemComponent,
    TagInputAutocompleteComponent
  ],
  exports: [
    AngularTagInputComponent
  ]
})
export class AngularTagInputModule { }
