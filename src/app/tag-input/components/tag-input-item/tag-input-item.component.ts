import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'angular-tag-input-item',
  template: `
    {{text}}
    <span class="angular-tag-input-remove" (click)="removeTag()">&times;</span>
  `,
  styles: [`
    :host {
      height: 32px;
      line-height: 32px;
      display: inline-block;
      background: #e0e0e0;
      padding: 0 12px;
      border-radius: 90px;
      margin-right: 10px;
      transition: all 0.12s ease-out;
    }

    :host .angular-tag-input-remove {
      background: #a6a6a6;
      border-radius: 50%;
      color: #e0e0e0;
      cursor: pointer;
      display: inline-block;
      font-size: 17px;
      height: 24px;
      line-height: 24px;
      margin-left: 6px;
      margin-right: -6px;
      text-align: center;
      width: 24px;
    }

    :host.angular-tag-input-item-selected {
      color: white;
      background: #0d8bff;
    }

    :host.angular-tag-input-item-selected .angular-tag-input-remove {
      background: white;
      color: #0d8bff;
    }
  `]
})
export class TagInputItemComponent {
  @Input() selected: boolean;
  @Input() index: number;
  @Input() displayBy: string;
  @Output() tagRemoved: EventEmitter<number> = new EventEmitter<number>();
  @HostBinding('class.angular-tag-input-item-selected') get isSelected() { return !!this.selected; }

  private textToParse: string;

  @Input()
  set text(value) {
    this.textToParse = typeof value === 'string' ? value : value[this.displayBy];
  }

  get text() {
    return this.textToParse;
  }

  constructor() { }

  removeTag(): void {
    this.tagRemoved.emit(this.index);
  }
}
