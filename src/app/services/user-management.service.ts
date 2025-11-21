import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private apiUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.apiUrl = this.configService.getConfig().serverIP;
  }

  // --- Vérification Initiale ---
  checkAdminExists(): Observable<any> {
    return this.http.get(`${this.apiUrl}authentication/check-admin`);
  }

  // --- Gestion Utilisateurs (CRUD) ---
  list(filter: any): Observable<any> {
    return this.http.post(`${this.apiUrl}user/list`, filter);
  }

  insert(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}user/insert`, user);
  }

  update(user: any): Observable<any> {
    return this.http.put(`${this.apiUrl}user/update`, user);
  }

  delete(login: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}user/delete/${login}`);
  }

  // --- Rôles ---
  getRoles(): Observable<any> {
    return this.http.get(`${this.apiUrl}roles`);
  }

  // --- Permissions ---
  listPermissionsByUser(userID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}permission/user/${userID}`);
  }
  
  // --- Groupes ---
  listGroupesByUser(userID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}groupe/user/${userID}`);
  }
}