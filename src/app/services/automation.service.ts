import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AutomationService {
  private apiUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.apiUrl = this.configService.getConfig().serverIP;
  }

  saveRule(rule: any): Observable<any> {
    return this.http.post(`${this.apiUrl}automation/rule`, rule);
  }

  listRulesByProjet(projetID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}automation/rules/${projetID}`);
  }

  deleteRule(ruleID: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}automation/rule/${ruleID}`);
  }
}