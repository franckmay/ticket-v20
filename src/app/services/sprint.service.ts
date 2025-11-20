import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class SprintService {
  private apiUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.apiUrl = this.configService.getConfig().serverIP;
  }

  list(criteria: any): Observable<any> {
    return this.http.post(`${this.apiUrl}sprint/list`, criteria);
  }

  insert(sprint: any): Observable<any> {
    return this.http.post(`${this.apiUrl}sprint/insert`, sprint);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}sprint/delete/${id}`);
  }

  // --- Tickets du Sprint ---
  getTickets(sprintID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}sprintTicket/list/${sprintID}`);
  }

  getTicketsRight(sprintID: string): Observable<any> {
    // TODO: Vérifier si cette route existe bien côté Laravel ou si c'est une legacy
    return this.http.get(`${this.apiUrl}sprintTicket/listR/${sprintID}`);
  }
}