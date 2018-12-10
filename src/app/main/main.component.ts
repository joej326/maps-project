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
  alertActive = false;

  callbackForLocationData = (results, status) => {
    console.log('results:', results);

    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // concat the arrays from the multiple queries
      this.locationResultsData = this.locationResultsData.concat(results);
      console.log('a result:', results[0]);

      for (let i = 0; i < this.locationResultsData.length; i++) {
        if (this.locationResultsData[i].photos) {
          this.locationPhotoUrlsAndIds[this.locationResultsData[i].id]
             = this.locationResultsData[i].photos[0].getUrl();
        }
        const placeId = this.locationResultsData[i].placeId;
      }
      console.log('before getDetails of placeas', this.locationResultsData);
      this.getDetailsOfPlaces(this.locationResultsData);
    } else {
      this.alertActive = true;
      alert(`There was an error processing your request: ${status}`);
    }
  }

  constructor(
    private retrievePlaceDetailsService: RetrievePlaceDetailsService,
    private renderer: Renderer2
  ) {}

  ngOnInit() {}

  ngAfterContentInit() {
    this.fetchNewLocationData(this.titleScreenElem);
  }


  fetchNewLocationData(inputElem, enterPressed?) {
    this.alertActive = false;
    this.filteredPlacesByLateHours = [];
    // this.locationResultsData = [];

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
              const queriesForLocation = ['coffee', 'lounge', 'cafe'];

              queriesForLocation.map(
                (query) => {
                  console.log(query);
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
              this.alertActive = true;
              alert('Not a valid search, no data found.');
            }
          },
          );
      }
    }
    // this block added in an attempt to add results from ALL queries.
    // Need to see if kava place is showing up in results but not rendering always
    // setTimeout(() => {
    //   this.getDetailsOfPlaces(this.locationResultsData);
    // }, 5000);
  }

  getDetailsOfPlaces(locationResultsData) {
    console.log('getDetailsOfPlaces');
    const daysOfTheWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // const currentDayOfTheWeek = daysOfTheWeek[new Date().getDay()];
    const currentDayOfTheWeek = 'Friday';
    // this.filteredPlacesByLateHours = [];

    const callback = (place, status) => {
      console.log('callback');
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


    console.log('results 2:', locationResultsData);
    locationResultsData.map(
      (location) => {
        const placeId = location.place_id;

        const detailsRequest = {
          placeId,
          fields: ['name', 'rating', 'price_level', 'website', 'opening_hours', 'place_id', 'geometry', 'id', 'formatted_address', 'types']
        };
        // console.log('before callback sent');
        this.service.getDetails(detailsRequest, callback);
      }
    );
  }
}
