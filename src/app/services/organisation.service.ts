import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class OrganisationService {
  private apiUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.apiUrl = this.configService.getConfig().serverIP;
  }

  list(): Observable<any> {
    return this.http.get(`${this.apiUrl}organisation/list`);
  }

  insert(org: any): Observable<any> {
    return this.http.post(`${this.apiUrl}organisation/insert`, org);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}organisation/delete/${id}`);
  }

  // --- Propriétaires ---
  listProprietaires(): Observable<any> {
    return this.http.get(`${this.apiUrl}proprietaire/list`);
  }

  listProprietairesByOrg(orgID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}proprietaire/organisation/${orgID}`);
  }

  insertProprietaire(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}proprietaire/insert`, data);
  }

  deleteProprietaire(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}proprietaire/${id}`);
  }
}