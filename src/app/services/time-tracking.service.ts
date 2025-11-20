import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class TimeTrackingService {
  private apiUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.apiUrl = this.configService.getConfig().serverIP;
  }

  saveWorklog(worklog: any): Observable<any> {
    return this.http.post(`${this.apiUrl}worklog/save`, worklog);
  }

  listByTicket(ticketID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}worklog/ticket/${ticketID}`);
  }

  deleteWorklog(worklogID: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}worklog/${worklogID}`);
  }
}