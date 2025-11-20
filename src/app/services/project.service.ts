import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class ProjetService {
  private apiUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.apiUrl = this.configService.getConfig().serverIP;
  }

  // --- Projets ---
  list(criteria: any): Observable<any> {
    return this.http.post(`${this.apiUrl}projet/list`, criteria);
  }

  getAll(): Observable<any> {
    return this.http.get(`${this.apiUrl}projet/list`);
  }

  insert(projet: any): Observable<any> {
    return this.http.post(`${this.apiUrl}projet/insert`, projet);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}projet/delete/${id}`);
  }

  // --- Equipes Projet ---
  listEquipes(criteria: any): Observable<any> {
    return this.http.post(`${this.apiUrl}projetequipe/list`, criteria);
  }

  insertEquipe(equipe: any): Observable<any> {
    return this.http.post(`${this.apiUrl}projetequipe/insert`, equipe);
  }

  deleteEquipe(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}projetequipe/delete/${id}`);
  }

  // --- Membres Projet ---
  listMembresEquipe(criteria: any): Observable<any> {
    return this.http.post(`${this.apiUrl}membre/listEquipe`, criteria);
  }

  insertMembre(membre: any): Observable<any> {
    return this.http.post(`${this.apiUrl}membre/insert`, membre);
  }

  insertMembreMultiple(membres: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}membre/insertAll`, membres);
  }
}