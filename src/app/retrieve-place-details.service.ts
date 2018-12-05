import { Injectable } from '@angular/core';

import { api } from '../../.config';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RetrievePlaceDetailsService {

  apiKey = api.key;

  constructor(private http: HttpClient) { }

  getPlaceDetails(address) {
    return (
      this.http
      .get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${this.apiKey}`)
    );

  }
}
