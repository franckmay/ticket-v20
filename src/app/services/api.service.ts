import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { SessionStorageService } from './session/session-storage.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';
import { RegisterRequest } from '../class/dto/register-request';
import { Organisation } from '../class/organisation';
import { User } from '../class/user';


import { ProjetEquipe } from '../class/projet-equipe';
import { Projets } from '../class/projets';
import { SprintTicket } from '../class/sprint-ticket';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  urlPermissionList = ''
  urlPermissionInsert = ''
  urlPermissionDelete = ''
  urlUserList = ''
  urlUserInsert = ''
  urlUserUpdate = ''
  urlUserDelete = ''
  //---------------------------
  urlOrganisationList = ''
  urlProjetList = ''
  urlProjetListByOrg = ''
  urlProprietaireList = ''
  urlProprietaireListByOrg = ''
  urlProjetInsert = ''
  urlProjetDelete = ''
  urlProjetEquipeInsert = ''
  urlProjetEquipeList = ''
  urlProjetEquipeDelete = ''


  urlOrganisationInsert = ''
  urlOrganisationDelete = ''
  urlMembreList = ''
  urlMembreListByEquipe = ''
  urlMembreInsert = ''
  urlMembreAffecter = ''
  urlMembreAffecterAll = ''
  urlListPriorite = ''
  urlListMembreRole = ''
  //---------------------------



  urlUserStoryList = '';
  urlUserStoryInsert = '';
  urlUserStoryDelete = '';

  urlTicketList = '';
  urlTicketInsert = '';
  urlTicketDelete = '';
  urlPrioriteList = '';

  urltypeticketList = '';
  //---------------------------

  urlTicketMembreList = '';
  urlTicketMembreInsert = '';
  urlTicketMembreInsertAll = '';
  urlTicketMembreDelete = '';
  //---------------------------
  urlSprintList = ''
  urlSprintInsert = ''
  urlSprintDelete = ''
  urlSprintTicketInsert = ''
  urlSprintTickets = ''
  urlSprintTicketDelete = ''
  urlSprintUpdate = ''
  //---------------------------
  //---------------------------


  constructor(private http: HttpClient, private sessionService: SessionStorageService, private appConfigService: ConfigService) {
    console.log(this.appConfigService.getConfig().serverIP);
    const urlServeur = this.appConfigService.getConfig().serverIP;
    if (this.appConfigService.loaded) {

    } else {
      console.warn('Configuration not loaded yet.');
    }

    this.urlPermissionList = urlServeur + 'permission/list';
    this.urlPermissionInsert = urlServeur + 'permission/insert';
    this.urlPermissionDelete = urlServeur + 'permission/delete/';

    this.urlUserList = urlServeur + 'user/list';
    this.urlUserInsert = urlServeur + 'user/insert';
    this.urlUserUpdate = urlServeur + 'user/update';
    this.urlUserDelete = urlServeur + 'user/delete/';

    this.urlPrioriteList = urlServeur + 'priorite/list';
    // ------------------------------------------------------------------------------------------------------
    //---------------------------
    this.urltypeticketList = urlServeur + 'ticket-type';
    //---------------------------

    this.urlUserStoryList = urlServeur + '';
    this.urlUserStoryInsert = urlServeur + '';
    this.urlUserStoryDelete = urlServeur + '';

    //---------------------------
    this.urlTicketList = urlServeur + 'ticket/list';
    this.urlTicketInsert = urlServeur + 'ticket/insert';
    this.urlTicketDelete = urlServeur + 'ticket/delete/';

    //---------------------------
    this.urlTicketMembreList = urlServeur + 'ticket-membre/list';
    this.urlTicketMembreInsert = urlServeur + 'ticket-membre/insert';
    this.urlTicketMembreInsertAll = urlServeur + 'ticket-membre/insertAll';
    this.urlTicketMembreDelete = urlServeur + 'ticket-membre/delete/';
    // ------------------------------------------------------------------------------------------------------


    this.urlOrganisationList = urlServeur + 'organisation/list'
    this.urlOrganisationInsert = urlServeur + 'organisation/insert'
    this.urlOrganisationDelete = urlServeur + 'organisation/delete/'
    this.urlProprietaireList = urlServeur + 'proprietaire/list/'
    this.urlProprietaireListByOrg = urlServeur + 'proprietaire/organisation/'
    this.urlProjetList = urlServeur + 'projet/list'
    this.urlProjetInsert = urlServeur + 'projet/insert'
    this.urlProjetDelete = urlServeur + 'projet/delete/'
    this.urlProjetEquipeList = urlServeur + 'projetequipe/list'
    this.urlProjetEquipeInsert = urlServeur + 'projetequipe/insert'
    this.urlProjetEquipeDelete = urlServeur + 'projetequipe/delete/'
    this.urlMembreList = urlServeur + 'user/list'
    this.urlMembreListByEquipe = urlServeur + 'membre/listEquipe'
    this.urlMembreInsert = urlServeur + 'user/insert'
    this.urlMembreAffecter = urlServeur + 'membre/insert'
    this.urlMembreAffecterAll = urlServeur + 'membre/insertAll'
    this.urlListPriorite = urlServeur + 'priorite/list'

    this.urlListMembreRole = urlServeur + 'roles'


    this.urlSprintList = urlServeur + 'sprint/list'
    this.urlSprintTickets = urlServeur + 'sprintTicket/list'
    this.urlSprintDelete = urlServeur + 'sprint/delete/'
    this.urlSprintInsert = urlServeur + 'sprint/insert'

  }


  // Permission
  permissionList(fparam: any) { return this.http.post(this.urlPermissionList, fparam); }
  permissionInsert(permission: any) { return this.http.post(this.urlPermissionInsert, permission); }
  permissionDelete(id: string) { return this.http.delete(this.urlPermissionDelete + id); }
  // ------------------------------------------------------------------------------------------------------


  userList(filter: any) { return this.http.post(this.urlUserList, filter); }
  userInsert(data: any) { return this.http.post(this.urlUserInsert, data); }
  userUpdate(data: any) { return this.http.put(this.urlUserUpdate, data); }
  userDelete(id: string) { return this.http.delete(this.urlUserDelete + id); }
  // ------------------------------------------------------------------------------------------------------



  insertSprint(sprint: any): Observable<any> {
    return this.http.post(this.urlSprintInsert, sprint);
  }

  updateSprint(sprint: any): Observable<any> {
    return this.http.put(`${this.urlSprintUpdate}/${sprint.sprintID}`, sprint);
  }

  getSprintTickets(sprintID: string): Observable<any> {
    console.log(sprintID)
    return this.http.get<SprintTicket[]>(`${this.urlSprintTickets}/${sprintID}`);
  }

  public getSprints(parametre: any): Observable<any> {

    return this.http.post(this.urlSprintList, parametre);
  }



  public sprintDelete(id: string): Observable<any> { return this.http.delete(this.urlSprintDelete + id); }
  public sprintTicketDelete(id: string): Observable<any> { return this.http.delete(this.urlSprintTicketDelete + id); }





  // ------------------------------------------------------------------------------------------------------






  // ------------------------------------------------------------------------------------------------------

  public projetList(parametre: any): Observable<any> {
    return this.http.post(this.urlProjetList, parametre);
  }

  // ------------------------------------------------------------------------------------------------------
  public organisationList(): Observable<any> { return this.http.get(this.urlOrganisationList); }

  public organisationInsert(f: Organisation): Observable<any> { return this.http.post(this.urlOrganisationInsert, f); }

  public organisationDelete(id: string): Observable<any> { return this.http.delete(this.urlOrganisationDelete + id); }

  public proprietaireListByOrg(organisationID: string): Observable<any> {
    return this.http.get(this.urlProprietaireListByOrg + organisationID);
  }
  public proprietaireList(): Observable<any> { return this.http.get(this.urlProprietaireList); }

  public projetInsert(f: Projets): Observable<any> { return this.http.post(this.urlProjetInsert, f); }

  public projetDelete(id: string): Observable<any> { return this.http.delete(this.urlProjetDelete + id); }

  public projetEquipeList(parametres: any): Observable<any> {
    return this.http.post(this.urlProjetEquipeList, parametres);
  }
  public projetEquipeInsert(f: ProjetEquipe): Observable<any> { return this.http.post(this.urlProjetEquipeInsert, f); }

  public projetEquipeDelete(id: string): Observable<any> { return this.http.delete(this.urlProjetEquipeDelete + id); }

  public membreList(organisationID: string): Observable<any> { return this.http.post(this.urlMembreList, organisationID); }
  public membreListByEquipe(parameter: any): Observable<any> { console.log(parameter); return this.http.post(this.urlMembreListByEquipe, parameter); }
  
  
  public membreListByOrg(organisationID: string, projetequipeID: string): Observable<any> {
    return this.http.post(this.urlMembreListByEquipe, { organisationID: organisationID, projetequipeID: projetequipeID });
  }


  public membreInsert(f: User): Observable<any> { return this.http.post(this.urlMembreInsert, f); }

  public membreAffecter(f: any): Observable<any> { return this.http.post(this.urlMembreAffecter, f); }
  public membreAffecterlist(f: any): Observable<any> { return this.http.post(this.urlMembreAffecterAll, f); }

  public membreRoleList(): Observable<any> { return this.http.get(this.urlListMembreRole); }



  // ------------------------------------------------------------------------------------------------------






  // ------------------------------------------------------------------------------------------------------









  // ------------------------------------------------------------------------------------------------------






  // ------------------------------------------------------------------------------------------------------









  // ------------------------------------------------------------------------------------------------------



  // ------------------------------------------------------------------------------------------------------

  // userStory
  public userStoryList(): Observable<any> { return this.http.get(this.urlUserStoryList); }

  public userStoryInsert(userstory: any) { return this.http.post(this.urlUserStoryInsert, userstory); }

  userStoryDelete(id: string) { return this.http.delete(this.urlUserStoryDelete + id); }
  // tickets
  public ticketsList(): Observable<any> { return this.http.get(this.urlTicketList); }

  public ticketsListBy(parametre: any): Observable<any> { return this.http.post(this.urlTicketList, parametre); }

  public ticketsInsert(ticket: any) { return this.http.post(this.urlTicketInsert, ticket); }

  ticketsDelete(id: string) { return this.http.delete(this.urlTicketDelete + id); }

  // Priorite
  public prioriteList(): Observable<any> { return this.http.get(this.urlPrioriteList); }
  // type
  public typeTicketList(): Observable<any> { return this.http.get(this.urltypeticketList); }

  // ------------------------------------------------------------------------------------------------------

  public ticketMembreList(parametre: any): Observable<any> { return this.http.post(this.urlTicketMembreList, parametre); }

  public ticketMembreInsert(ticket: any) { return this.http.post(this.urlTicketMembreInsert, ticket); }
  public ticketMembreInsertList(ticket: any) { return this.http.post(this.urlTicketMembreInsertAll, ticket); }
  ticketMembreDelete(id: string) { return this.http.delete(this.urlTicketMembreDelete + id); }

  // ------------------------------------------------------------------------------------------------------
}
