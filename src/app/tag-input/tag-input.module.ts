import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TagInputComponent } from './components/tag-input/tag-input.component';
import { TagInputAutocompleteComponent } from './components/tag-input-autocomplete/tag-input-autocomplete.component';
import { TagInputItemComponent } from './components/tag-input-item/tag-input-item.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  declarations: [TagInputComponent, TagInputAutocompleteComponent, TagInputItemComponent],
  exports: [TagInputComponent, TagInputAutocompleteComponent, TagInputItemComponent]
})
export class TagInputModule { }
