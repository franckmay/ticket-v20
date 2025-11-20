import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';
const ITEM_KEY = 'item';
const ITEM_KEY_MENU = 'item';
const LANG_KEY = 'fr';
const MODULE_KEY = 'module';
const ORG_KEY = 'organisation';
const ORG_LIB = 'LibelleOrganisation';
const MILL_LIB = 'LibelleOrganisation';

const MILL_KEY = 'millesime';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {

  constructor(private router: Router) { }

  signOut(): void { window.sessionStorage.clear(); }

  public saveToken(token: string): void { window.sessionStorage.removeItem(TOKEN_KEY); window.sessionStorage.setItem(TOKEN_KEY, token); }

  public getToken(): any { return window.sessionStorage.getItem(TOKEN_KEY); }

  public saveUser(user: any): void {
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public saveOrganisation(organisationID: string, libelleFr: string): void {
    window.sessionStorage.removeItem(ORG_KEY);
    window.sessionStorage.setItem(ORG_KEY, organisationID);
    window.sessionStorage.removeItem(ORG_LIB);
    window.sessionStorage.setItem(ORG_LIB, libelleFr);
  }
  public saveMillesime(millesime: string, libelleFr: string): void {
    window.sessionStorage.removeItem(MILL_KEY);
    window.sessionStorage.setItem(MILL_KEY, millesime);
    window.sessionStorage.removeItem(MILL_LIB);
    window.sessionStorage.setItem(MILL_LIB, libelleFr);
  }

  public getOrganisation(): any { return window.sessionStorage.getItem(ORG_KEY); }
  public getMillesime(): any { return window.sessionStorage.getItem(MILL_KEY); }

  public getOrganisationLibelleFr(): any { return window.sessionStorage.getItem(ORG_LIB); }

  // public savePoste(posteID: string[]): void { let i: number = 0; for (let p of posteID) { i = i + 1; window.sessionStorage.removeItem('poste' + i); window.sessionStorage.setItem('poste' + i, p); } }
  public savePoste(posteID: string[]): void {
    for (let i = 1; i <= posteID.length; i++) {
      const POSTE_KEY = `poste${i}`; const poste = posteID[i - 1]; if (poste !== undefined) { window.sessionStorage.setItem(POSTE_KEY, poste); } else { window.sessionStorage.removeItem(POSTE_KEY); }
    }
  }

  // public getPostes(): any { let postes: any[] = []; for (let i = 1; i <= window.sessionStorage.length; i++) { postes.push(window.sessionStorage.getItem('poste' + i)); } return postes; }
  public getPostes(): string[] {
    const postes: string[] = [];
    for (let i = 1; i <= window.sessionStorage.length; i++) {
      const POSTE_KEY = `poste${i}`;
      const poste = window.sessionStorage.getItem(POSTE_KEY);
      if (poste !== null) {
        postes.push(poste);
      }
    }
    return postes;
  }


  public saveActivePoste(posteID: string): void { window.sessionStorage.removeItem('activePoste'); window.sessionStorage.setItem('activePoste', posteID); }

  public getActivePoste(): any { return window.sessionStorage.getItem('activePoste'); }

  public saveModule(module: string): void { window.sessionStorage.removeItem(MODULE_KEY); window.sessionStorage.setItem(MODULE_KEY, module); }

  public getCurrentModule() { return window.sessionStorage.getItem(MODULE_KEY); }

  public getUser(): any { const user = window.sessionStorage.getItem(USER_KEY); if (user) { return JSON.parse(user); } return {}; }

  // public saveRole(roles: string[]): void { let i: number = 0; for (let ROLE_KEY of roles) { i = i + 1; window.sessionStorage.removeItem('R' + i); window.sessionStorage.setItem('R' + i, ROLE_KEY) } }
  public saveRole(roles: string[]): void { for (let i = 0; i < roles.length; i++) { const ROLE_KEY = roles[i]; window.sessionStorage.setItem(`R${i + 1}`, ROLE_KEY); } }


  public getRoles(): string[] {
    const roles: string[] = []; for (let i = 1; i <= window.sessionStorage.length; i++) { const ROLE_KEY = `R${i}`; const role = window.sessionStorage.getItem(ROLE_KEY); if (role !== null) { roles.push(role); } } return roles;
  }

  public saveTicketRole(ticketRoles: string[]): void { let i: number = 0; for (let TICKET_ROLE_KEY of ticketRoles) { i = i + 1; window.sessionStorage.removeItem('TR' + i); window.sessionStorage.setItem('TR' + i, TICKET_ROLE_KEY); } }

  public getTicketRoles(): any { let ticketRoles: any[] = []; for (let i = 1; i <= window.sessionStorage.length; i++) { ticketRoles.push(window.sessionStorage.getItem('TR' + i)); } return ticketRoles; }

  public saveActiveItem(item: string): void { window.sessionStorage.removeItem(ITEM_KEY); window.sessionStorage.setItem(ITEM_KEY, item); }
  public saveActiveItemMenu(item: string): void { window.sessionStorage.removeItem(ITEM_KEY_MENU); window.sessionStorage.setItem(ITEM_KEY_MENU, item); }

  public saveActiveLang(item: string): void {
    console.log(item);
    window.sessionStorage.removeItem(LANG_KEY); window.sessionStorage.setItem(LANG_KEY, item);
  }
  public getActiveItem() {
    let res: any; if
      (window.sessionStorage.getItem(ITEM_KEY) == null) {
      res = 'accueil'
    } else { res = window.sessionStorage.getItem(ITEM_KEY); } return res;
  }
  public getActiveItemMenu() {
    let res: any; if
      (window.sessionStorage.getItem(ITEM_KEY_MENU) == null) {
      res = 'accueil'
    } else { res = window.sessionStorage.getItem(ITEM_KEY_MENU); } return res;
  }
  public getActiveLang() {
    let res: any; if
      (window.sessionStorage.getItem(LANG_KEY) == null) {
      res = 'fr'
    } else { res = window.sessionStorage.getItem(LANG_KEY); } return res;
  }
  public resetActiveItem() { window.sessionStorage.removeItem(ITEM_KEY); }

  getAll() { console.log("Liste des rôles:", this.getRoles()); console.log("Organisation actuelle:", this.getOrganisation()); console.log("Élément actif:", this.getActiveItem()); console.log("Module actuel:", this.getCurrentModule()); }


}
