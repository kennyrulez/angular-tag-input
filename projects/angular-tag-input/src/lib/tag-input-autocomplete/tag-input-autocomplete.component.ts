import { Component, OnInit, Input, Output, EventEmitter, ElementRef, OnChanges, OnDestroy } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import { KEYS } from '../../shared/tag-input-keys';

@Component({
  selector: 'angular-tag-input-autocomplete',
  template: `
    <div
      *ngFor="let item of itemsToParse; let itemIndex = index"
      [ngClass]="{ 'is-selected': selectedItemIndex === itemIndex }"
      (mousedown)="selectItem(itemIndex)"
      class="angular-autocomplete-item">
      {{item[displayBy]}}
    </div>
  `,
  styles: [`
    :host {
      background-color:fuchsia;
      box-shadow: 0 1.5px 4px rgba(0, 0, 0, 0.24), 0 1.5px 6px rgba(0, 0, 0, 0.12);
      display: block;
      position: absolute;
      top: 100%;
      color: #444444;
      background: white;
      padding: 8px 0;
    }

    :host .angular-autocomplete-item {
      padding: 0 16px;
      height: 48px;
      line-height: 48px;
    }

    :host .is-selected {
      background: #eeeeee;
    }
  `]
})
export class TagInputAutocompleteComponent implements OnChanges, OnDestroy, OnInit {
  @Input() displayBy: string;
  @Input() selectFirstItem = false;
  @Output() itemSelected: EventEmitter<string> = new EventEmitter<string>();
  @Output() enterPressed: EventEmitter<any> = new EventEmitter<any>();
  @Output() tabPressed: EventEmitter<any> = new EventEmitter<any>();
  public selectedItemIndex: number = null;
  private keySubscription: Subscription;
  private get itemsCount(): number {
    return this.itemsToParse ? this.itemsToParse.length : 0;
  }

  itemsToParse: Array<any> = [];

  @Input()
  set items(value: Array<any>) {
    this.itemsToParse = [];
    for (let i = 0; i < value.length; i++) {
      const currentItem = value[0];
      if (typeof currentItem === 'object') {
        this.itemsToParse.push(currentItem);
      } else {
        this.itemsToParse.push({ [this.displayBy]: currentItem });
      }
    }
  }

  constructor(private elementRef: ElementRef) { }

  ngOnInit() {
    this.keySubscription = fromEvent(window, 'keydown').pipe(
      filter(
        (event: KeyboardEvent) =>
          event.keyCode === KEYS.upArrow ||
          event.keyCode === KEYS.downArrow ||
          event.keyCode === KEYS.enter ||
          event.keyCode === KEYS.esc
      ),
      tap((event: KeyboardEvent) => {
        switch (event.keyCode) {
          case KEYS.downArrow:
            this.handleDownArrow();
            break;

          case KEYS.upArrow:
            this.handleUpArrow();
            break;

          case KEYS.enter:
            this.selectItem();
            this.enterPressed.emit();
            break;

          case KEYS.tab:
            this.selectItem();
            this.tabPressed.emit();
            break;

          case KEYS.esc:
            break;
        }

        event.stopPropagation();
        event.preventDefault();
      }))
      .subscribe();
  }

  ensureHighlightVisible() {
    const container = this.elementRef.nativeElement.querySelector('.sk-select-results__container');
    if (!container) {
      return;
    }
    const choices = container.querySelectorAll('.sk-select-results__item');
    if (choices.length < 1) {
      return;
    }
    if (this.selectedItemIndex < 0) {
      return;
    }
    const highlighted: any = choices[this.selectedItemIndex];
    if (!highlighted) {
      return;
    }
    const posY: number = highlighted.offsetTop + highlighted.clientHeight - container.scrollTop;
    const height: number = container.offsetHeight;

    if (posY > height) {
      container.scrollTop += posY - height;
    } else if (posY < highlighted.clientHeight) {
      container.scrollTop -= highlighted.clientHeight - posY;
    }
  }

  goToTop() {
    this.selectedItemIndex = 0;
    this.ensureHighlightVisible();
  }

  goToBottom(itemsCount: number) {
    this.selectedItemIndex = itemsCount - 1;
    this.ensureHighlightVisible();
  }

  goToNext() {
    if (this.selectedItemIndex + 1 < this.itemsCount) {
      this.selectedItemIndex++;
    } else {
      this.goToTop();
    }
    this.ensureHighlightVisible();
  }

  goToPrevious() {
    if (this.selectedItemIndex - 1 >= 0) {
      this.selectedItemIndex--;
    } else {
      this.goToBottom(this.itemsCount);
    }
    this.ensureHighlightVisible();
  }

  handleUpArrow(): void | boolean {
    if (this.selectedItemIndex === null) {
      this.goToBottom(this.itemsCount);
      return false;
    }
    this.goToPrevious();
  }

  handleDownArrow(): void | boolean {
    // Initialize to zero if first time results are shown
    if (this.selectedItemIndex === null) {
      this.goToTop();
      return false;
    }
    this.goToNext();
  }

  selectItem(itemIndex?: number): void {
    const itemToEmit = itemIndex ? this.itemsToParse[itemIndex] : this.itemsToParse[this.selectedItemIndex];
    if (itemToEmit) {
      this.itemSelected.emit(itemToEmit);
    }
  }

  ngOnChanges() {
    if (this.selectFirstItem && this.itemsCount > 0) {
      this.goToTop();
    }
  }

  ngOnDestroy() {
    this.keySubscription.unsubscribe();
  }
}
