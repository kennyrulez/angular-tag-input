import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR, FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { tap } from 'rxjs/operators';

import { KEYS } from '../../shared/tag-input-keys';

/**
 * Taken from @angular/common/src/facade/lang
 */
function isBlank(obj: any): boolean {
  return obj === undefined || obj === null;
}

export interface AutoCompleteItem {
  [index: string]: any;
}

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'angular-tag-input',
  template: `
    <angular-tag-input-item
      [text]="tag"
      [index]="index"
      [displayBy]="displayBy"
      [selected]="selectedTag === index"
      (tagRemoved)="_removeTag($event)"
      *ngFor="let tag of tagsList; let index = index">
    </angular-tag-input-item>
    <form [formGroup]="tagInputForm" class="angular-tag-input-form">
      <input
        class="angular-tag-input-field"
        type="text"
        #tagInputElement
        formControlName="tagInputField"
        [placeholder]="placeholder"
        (paste)="onInputPaste($event)"
        (keydown)="onKeydown($event)"
        (blur)="onInputBlurred($event)"
        (focus)="onInputFocused()">

      <div *ngIf="showAutocomplete()" class="angular-tag-input-autocomplete-container">
        <angular-tag-input-autocomplete
          [displayBy]="autocompleteDisplayBy"
          [items]="autocompleteResults"
          [selectFirstItem]="autocompleteSelectFirstItem"
          (itemSelected)="onAutocompleteSelect($event)"
          (enterPressed)="onAutocompleteEnter($event)">
        </angular-tag-input-autocomplete>
      </div>
    </form>
  `,
  styles: [`
    :host {
      display: block;
      box-shadow: 0 1px #ccc;
      padding: 8px 0 6px 0;
      will-change: box-shadow;
      transition: box-shadow 0.12s ease-out;
    }

    :host .angular-tag-input-form {
      display: inline;
    }

    :host .angular-tag-input-field {
      border: none !important;
      border-radius: 0 !important;
      display: inline-block;
      width: auto;
      box-shadow: none;
      padding: 8px 0;
    }

    :host .angular-tag-input-field:focus {
      outline: 0;
    }

    :host .angular-tag-input-autocomplete-container {
      position: relative;
      z-index: 10;
    }
  `],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TagInputComponent), multi: true },
  ]
})
export class TagInputComponent implements ControlValueAccessor, OnDestroy, OnInit {
  @HostBinding('class.angular-tag-input-focus') isFocused: boolean;
  @Input() addOnBlur = true;
  @Input() addOnComma = true;
  @Input() addOnEnter = true;
  @Input() addOnPaste = true;
  @Input() addOnSpace = false;
  @Input() allowDuplicates = false;
  @Input() allowedTagsPattern: RegExp = /.+/;
  @Input() autocomplete = false;
  @Input() autocompleteItems: Array<any> = [];
  @Input() autocompleteMustMatch = true;
  @Input() autocompleteSelectFirstItem = true;
  @Input() autocompleteDisplayBy = 'name';
  @Input() pasteSplitPattern = ',';
  @Input() placeholder = 'Add a tag';
  @Input() autocompleteObservable: Observable<Array<any>>;
  @Input() displayBy = 'name';
  @Input() convertOutputToObject = false;
  @Output('addTag') addTag: EventEmitter<string> = new EventEmitter<string>();
  @Output('removeTag') removeTag: EventEmitter<string> = new EventEmitter<string>();
  @ViewChild('tagInputElement') tagInputElement: ElementRef;

  private canShowAutoComplete = false;
  private tagInputSubscription: Subscription;
  private autocompleteSubscription: Subscription;
  private splitRegExp: RegExp;
  private get tagInputField(): AbstractControl {
    return this.tagInputForm.get('tagInputField');
  }
  private get inputValue(): string {
    return this.tagInputField.value;
  }

  public tagInputForm: FormGroup;
  public autocompleteResults: string[] = [];
  public tagsList: Array<any> = [];
  public selectedTag: number;

  @HostListener('document:click', ['$event', '$event.target']) onDocumentClick(event: MouseEvent, target: HTMLElement) {
    if (!target) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(target)) {
      this.canShowAutoComplete = false;
    }
  }

  constructor(
    private fb: FormBuilder,
    private elementRef: ElementRef) { }

  ngOnInit() {

    this.splitRegExp = new RegExp(this.pasteSplitPattern);

    this.tagInputForm = this.fb.group({
      tagInputField: ''
    });

    if (this.autocompleteObservable) {
      this.autocompleteSubscription = this.autocompleteObservable
        .subscribe(value => this.autocompleteResults = value);

      this.tagInputSubscription = this.tagInputField.valueChanges
        .subscribe(() => this.autocompleteResults = []);
    } else {
      this.tagInputSubscription = this.tagInputField.valueChanges.pipe(
        tap(value => {
          this.autocompleteResults = this.autocompleteItems.filter(item => {
            /**
             * _isTagUnique makes sure to remove items from the autocompelte dropdown if they have
             * already been added to the model, and allowDuplicates is false
             */
            const itemToCheck = typeof item === 'object' ? item[this.autocompleteDisplayBy] : item;

            return itemToCheck.toLowerCase().indexOf(value.toLowerCase()) > -1 && this._isTagUnique(item);
          });
        }))
        .subscribe();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    const key = event.keyCode;
    switch (key) {
      case KEYS.backspace:
        this._handleBackspace();
        break;

      case KEYS.enter:
        if (this.addOnEnter && !this.showAutocomplete()) {
          this._addTags([this.inputValue]);
          event.preventDefault();
        }
        break;

      case KEYS.comma:
        if (this.addOnComma) {
          this._addTags([this.inputValue]);
          event.preventDefault();
        }
        break;

      case KEYS.space:
        if (this.addOnSpace) {
          this._addTags([this.inputValue]);
          event.preventDefault();
        }
        break;

      default:
        break;
    }
  }

  onInputBlurred(event: object): void {
    if (this.addOnBlur) { this._addTags([this.inputValue]); }
    this.isFocused = false;
  }

  onInputFocused(): void {
    this.isFocused = true;
    setTimeout(() => this.canShowAutoComplete = true);
  }

  onInputPaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    const pastedString = clipboardData.getData('text/plain');
    const tags = this._splitString(pastedString);
    this._addTags(tags);
    setTimeout(() => this._resetInput());
  }

  onAutocompleteSelect(selectedItem: string | object) {
    this._addTags([selectedItem]);
    this.tagInputElement.nativeElement.focus();
  }

  onAutocompleteEnter() {
    if (this.addOnEnter && this.showAutocomplete() && !this.autocompleteMustMatch) {
      this._addTags([this.inputValue]);
    }
  }

  showAutocomplete(): boolean {
    return (
      this.autocomplete &&
      (
        this.autocompleteItems && this.autocompleteItems.length > 0 ||
        this.autocompleteResults && this.autocompleteResults.length > 0
      ) &&
      this.canShowAutoComplete &&
      this.inputValue.length > 0
    );
  }

  private _splitString(tagString: string): string[] {
    tagString = tagString.trim();
    const tags = tagString.split(this.splitRegExp);
    return tags.filter((tag) => !!tag);
  }

  private _isTagValid(tag: any): boolean {
    const valueToCheck = typeof tag === 'object' ? tag[this.displayBy] : tag;
    return this.allowedTagsPattern.test(valueToCheck) && this._isTagUnique(tag);
  }

  private _isTagUnique(tag: any): boolean {
    if (this.allowDuplicates) { return true; }

    const valueToCheck = typeof tag === 'object' ? tag[this.displayBy] : tag;
    for (let i = 0; i < this.tagsList.length; i++) {
      const current = this.tagsList[i];
      if (typeof current === 'object' && current[this.displayBy] === valueToCheck) { return false; }
      if (current === valueToCheck) { return false; }
    }

    return true;
  }

  private _isTagAutocompleteItem(tag: any): boolean {
    const valueToCheck = typeof tag === 'object' ? tag[this.autocompleteDisplayBy] : tag;
    for (let i = 0; i < this.autocompleteItems.length; i++) {
      const current = this.autocompleteItems[i];
      if (typeof current === 'object' && current[this.autocompleteDisplayBy] === valueToCheck) { return false; }
      if (current === valueToCheck) { return false; }
    }

    return true;
  }

  private _emitTagAdded(addedTags: string[]): void {
    addedTags.forEach(tag => this.addTag.emit(tag));
  }

  private _emitTagRemoved(removedTag: string): void {
    this.removeTag.emit(removedTag);
  }

  private _addTags(tags: any[]): void {
    const validTags = tags.filter(tag => this._isTagValid(tag))
      .filter((tag, index, tagArray) => tagArray.indexOf(tag) === index)
      .filter(tag => (this.showAutocomplete() && this.autocompleteMustMatch) ? this._isTagAutocompleteItem(tag) : true)
      .map(tag => {
        // if the element comes from autocomplete, we must move the value from [autocompleteDisplayBy] to [displayBy]
        if (typeof tag === 'object' && tag[this.autocompleteDisplayBy] !== undefined && this.autocompleteDisplayBy !== this.displayBy) {
          /**
           * Due to reference nature of object passed in javascript, it's better to create a new object instead of modifying
           * the current one. This keep the autocomplete list untouched
           */
          const copiedTag = Object.assign({}, tag);
          copiedTag[this.displayBy] = copiedTag[this.autocompleteDisplayBy];
          delete copiedTag[this.autocompleteDisplayBy];
          tag = copiedTag;
        }
        return tag;
      });

    if (this.convertOutputToObject) {
      for (let i = 0; i < validTags.length; i++) {
        if (typeof validTags[i] === 'object') { continue; }

        validTags[i] = { [this.displayBy]: validTags[i] };
      }
    }

    this.tagsList = this.tagsList.concat(validTags);
    this._resetSelected();
    this._resetInput();
    this.onChange(this.tagsList);
    this._emitTagAdded(validTags);
  }

  private _removeTag(tagIndexToRemove: number): void {
    const removedTag = this.tagsList[tagIndexToRemove];
    this.tagsList.splice(tagIndexToRemove, 1);
    this._resetSelected();
    this.onChange(this.tagsList);
    this._emitTagRemoved(removedTag);
  }

  private _handleBackspace(): void {
    if (!this.inputValue.length && this.tagsList.length) {
      if (!isBlank(this.selectedTag)) {
        this._removeTag(this.selectedTag);
      } else {
        this.selectedTag = this.tagsList.length - 1;
      }
    }
  }

  private _resetSelected(): void {
    this.selectedTag = null;
  }

  private _resetInput(): void {
    this.tagInputField.setValue('');
  }

  /** Implemented as part of ControlValueAccessor. */
  onChange: (value: any) => any = () => { };

  onTouched: () => any = () => { };

  writeValue(value: any) {
    this.tagsList = value;
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  ngOnDestroy() {

    this.tagInputSubscription.unsubscribe();

    if (this.autocompleteSubscription) {
      this.autocompleteSubscription.unsubscribe();
    }
  }
}
