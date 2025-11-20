import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.apiUrl = this.configService.getConfig().serverIP;
  }

  saveDashboard(dashboard: any): Observable<any> {
    return this.http.post(`${this.apiUrl}dashboard/save`, dashboard);
  }

  listByUser(userID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}dashboard/user/${userID}`);
  }

  deleteDashboard(dashboardID: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}dashboard/${dashboardID}`);
  }
}