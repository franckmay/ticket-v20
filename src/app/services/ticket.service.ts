import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.apiUrl = this.configService.getConfig().serverIP;
  }

  // --- Tickets CRUD ---
  list(criteria: any): Observable<any> {
    return this.http.post(`${this.apiUrl}ticket/list`, criteria);
  }

  insert(ticket: any): Observable<any> {
    return this.http.post(`${this.apiUrl}ticket/insert`, ticket);
  }

  delete(ticketID: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}ticket/delete/${ticketID}`);
  }

  // --- Métadonnées (Types, Statuts, Priorités) ---
  getTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}ticket-type`);
  }

  getStatuts(): Observable<any> {
    return this.http.get(`${this.apiUrl}ticket-statut`);
  }

  getPriorites(): Observable<any> {
    return this.http.get(`${this.apiUrl}priorite/list`);
  }

  // --- Assignation Membres ---
  listMembres(criteria: any): Observable<any> {
    return this.http.post(`${this.apiUrl}ticket-membre/list`, criteria);
  }

  assignMembre(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}ticket-membre/insert`, data);
  }
  
  assignMembreMultiple(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}ticket-membre/insertAll`, data);
  }

  removeMembre(ticketID: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}ticket-membre/delete/${ticketID}`);
  }

  // --- Commentaires ---
  getCommentaires(ticketID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}ticket-commentaire/${ticketID}`);
  }

  addCommentaire(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}ticket-commentaire`, data);
  }

  deleteCommentaire(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}ticket-commentaire/${id}`);
  }

  // --- Pièces Jointes ---
  getPiecesJointes(ticketID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}ticket-piece/${ticketID}`);
  }
}