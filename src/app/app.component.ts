import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'maps-project';
  titleScreen = true;

  titleScreenElem;


  leaveTitleScreen(event) {
    this.titleScreen = false;
    this.titleScreenElem = event;
  }
}
