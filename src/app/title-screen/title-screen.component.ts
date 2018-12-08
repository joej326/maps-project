import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-title-screen',
  templateUrl: './title-screen.component.html',
  styleUrls: ['./title-screen.component.scss']
})
export class TitleScreenComponent implements OnInit {

  @Output() notifySearchEmitter = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  notifySearch(inputElem) {
    this.notifySearchEmitter.emit(inputElem);
  }

}
