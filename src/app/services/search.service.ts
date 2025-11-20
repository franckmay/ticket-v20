import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.apiUrl = this.configService.getConfig().serverIP;
  }

  saveFilter(filter: any): Observable<any> {
    return this.http.post(`${this.apiUrl}search/filter`, filter);
  }

  listFilters(userID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}search/filters/${userID}`);
  }

  deleteFilter(filterID: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}search/filter/${filterID}`);
  }
}