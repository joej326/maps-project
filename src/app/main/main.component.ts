/// <reference types='@types/googlemaps' />
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterContentInit,
  Renderer2,
  Input
} from '@angular/core';
import { RetrievePlaceDetailsService } from '../retrieve-place-details.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, AfterContentInit {
  @Input() titleScreenElem;

  @ViewChild('locationSearchElem') locationSearchElem: ElementRef;
  @ViewChild('mainMap') mainMap: ElementRef;
  googleMap: google.maps.Map;
  service;
  locationResultsData = [];
  locationPhotoUrlsAndIds = {};
  openHours = [];
  filteredPlacesByLateHours = [];

  callbackForLocationData = (results, status) => {
    console.log('results:', results);
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      this.locationResultsData = this.locationResultsData.concat(results);
      console.log('a result:', results[0]);

      for (let i = 0; i < results.length; i++) {
        if (results[i].photos) {
          this.locationPhotoUrlsAndIds[results[i].id] = results[i].photos[0].getUrl();
        }
        const placeId = results[i].placeId;
      }
      this.getDetailsOfPlaces(results);
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

    // const initialize = (map) => {
    //   const myInput = <HTMLInputElement> this.titleScreenElem.nativeElement;
    //   const pyrmont = new google.maps.LatLng(-33.8665433, 151.1956316);
    //   const mySearch = new google.maps.places.SearchBox(myInput);

    //   map = new google.maps.Map(this.mainMap.nativeElement, {
    //     center: pyrmont,
    //     zoom: 15
    //   });
    //   this.googleMap = map;
    // };
    // initialize(this.googleMap);
    this.fetchNewLocationData(this.titleScreenElem);
  }


  fetchNewLocationData(inputElem, enterPressed?) {
    this.filteredPlacesByLateHours = [];

    // ensures only one search is performed
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
              this.googleMap = new google.maps.Map(
                this.mainMap.nativeElement,
                {
                  center: locationCenter,
                  zoom: 15
                }
              );

              // made into array to map through - potentially to utilize multiple query searches
              const queriesForLocation = ['lounge'];

              queriesForLocation.map(
                (query) => {
                  const placeRequest = {
                    location: locationCenter,
                    radius: '800',
                    // type: ['cafe'],
                    query: query
                  };

                  this.service = new google.maps.places.PlacesService(this.googleMap);
                  const locationData = this.service.textSearch(
                    placeRequest,
                    this.callbackForLocationData
                  );
                }
              );

            } else if (!data['results'].length) {
              alert('Not a valid search, no data found.');
            }
          },
          );
      }
    }
  }

  getDetailsOfPlaces(placesResults) {
    const daysOfTheWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // const currentDayOfTheWeek = daysOfTheWeek[new Date().getDay()];
    const currentDayOfTheWeek = 'Monday';
    // this.filteredPlacesByLateHours = [];

    const callback = (place, status) => {
      let createMarker = false;
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        console.log('place:', place);
        console.log('all data', this.locationResultsData);
        // const weeksHours = <Array<string>> place.opening_hours.weeday_text;
        // weeksHours.split(',');
        let todaysHours;
        let todaysHoursString = '';
        if (place.opening_hours) {
          todaysHours = <Array<string>> place.opening_hours.weekday_text.filter((day: string) => day.startsWith(currentDayOfTheWeek));
          todaysHoursString = todaysHours[0];
        }
        console.log('days hours:', todaysHours);

        let matchedClosingTime = <string | RegExpMatchArray>
          todaysHoursString.match(/– (([1]?[901]:\d\d ?PM)|(([1]?[12345]:\d\d ?AM)))|(Open 24 hours)$/g);
        matchedClosingTime = matchedClosingTime ? matchedClosingTime[0] : matchedClosingTime;

        if (matchedClosingTime && matchedClosingTime.includes('hours')) {
          this.filteredPlacesByLateHours.push(place);
          createMarker = true;
        } else if (matchedClosingTime) {
          matchedClosingTime = matchedClosingTime.slice(2, matchedClosingTime.length);
          this.filteredPlacesByLateHours.push(place);
          createMarker = true;
        }

        if (createMarker) {
          const marker = new google.maps.Marker({
            map: this.googleMap,
            position: place.geometry.location,
            place: {
              placeId: place.place_id,
              location: place.geometry.location
            }
          });
        }

        console.log('closing time:', matchedClosingTime);
      }
      console.log('filtered array:' , this.filteredPlacesByLateHours);
    };
    console.log('results 2:', placesResults);
    this.locationResultsData.map(
      (location) => {
        const placeId = location.place_id;

        const detailsRequest = {
          placeId,
          fields: ['name', 'rating', 'price_level', 'website', 'opening_hours', 'place_id', 'geometry', 'id', 'formatted_address', 'types']
        };
        setTimeout(() => {
        this.service.getDetails(detailsRequest, callback);

        }, 100);
      }
    );
  }
}
