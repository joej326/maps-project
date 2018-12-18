import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, AfterContentInit } from '@angular/core';

@Component({
  selector: 'app-title-screen',
  templateUrl: './title-screen.component.html',
  styleUrls: ['./title-screen.component.scss']
})
export class TitleScreenComponent implements AfterContentInit {

  @Output() notifySearchEmitter = new EventEmitter();
  @ViewChild('locationSearchElem') locationSearchElem: ElementRef;

  constructor() { }

  ngAfterContentInit() {
    this.locationSearchElem.nativeElement.focus();
  }

  notifySearch(inputElem) {
    this.notifySearchEmitter.emit(inputElem);
  }

}
