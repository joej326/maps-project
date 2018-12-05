/// <reference types='@types/googlemaps' />
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterContentInit,
  DoCheck,
  Renderer2
} from '@angular/core';
import { RetrievePlaceDetailsService } from '../retrieve-place-details.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, AfterContentInit {

  @ViewChild('locationSearchElem') locationSearchElem: ElementRef;
  @ViewChild('mainMap') mainMap: ElementRef;
  map;
  service;
  locationResultsData = [];
  locationPhotoUrlsAndIds = {};
  openHours = [];

  callbackForLocationData = (results, status) => {
    console.log('results:', results);
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      this.locationResultsData = [...results];
      console.log('a result:', results[0]);

      for (let i = 0; i < results.length; i++) {
        if (results[i].photos) {
          this.locationPhotoUrlsAndIds[results[i].id] = results[i].photos[0].getUrl();
        }
        const placeId = results[i].placeId;
      }
    } else {
      alert(`There was an error processing your request: ${status}`);
    }
  }

  constructor(
    private retrievePlaceDetailsService: RetrievePlaceDetailsService,
    private renderer: Renderer2
  ) {}

  ngOnInit() {}

  ngAfterContentInit() {
    const initialize = (map) => {
      const myInput = <HTMLInputElement> this.locationSearchElem.nativeElement;
      const pyrmont = new google.maps.LatLng(-33.8665433, 151.1956316);
      const mySearch = new google.maps.places.SearchBox(myInput);

      map = new google.maps.Map(this.mainMap.nativeElement, {
        center: pyrmont,
        zoom: 15
      });
    };
    initialize(this.map);
  }


  fetchNewLocationData(inputElem, enterPressed?) {
    if (enterPressed) {
      inputElem.blur();
    } else {

      const address = inputElem.value;
      if (address) {
        const placeData = this.retrievePlaceDetailsService
          .getPlaceDetails(address)
          .subscribe(data => {
            if (data['results'].length) {
              const lat = data['results'][0].geometry.location.lat;
              const lng = data['results'][0].geometry.location.lng;
              const locationCenter = new google.maps.LatLng(lat, lng);
              this.map = new google.maps.Map(
                this.mainMap.nativeElement,
                {
                  center: locationCenter,
                  zoom: 15
                }
              );

              const placeRequest = {
                location: locationCenter,
                radius: '500',
                query: 'coffee'
              };

              const detailsRequest = {
                placeId: 'ChIJEanCMFWXTYcRSgLXoNooVW8',
                fields: ['name', 'rating', 'price_level', 'website', 'opening_hours']
              };

              this.service = new google.maps.places.PlacesService(this.map);
              const locationData = this.service.textSearch(
                placeRequest,
                this.callbackForLocationData
              );
            } else if (!data['results'].length) {
              alert('Not a valid search, no data found.');
            }
          },
          () => {},
          () => console.log('completed')
          );
      }
    }
  }
}
