import { Injectable } from '@angular/core';
import { Router } from '@angular/router';


const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';
const ORG_KEY = 'auth-organisation';
const MENU_KEY = 'auth-menu';
const LANG_KEY = 'fr';
const CART_KEY = 'shopping-cart';
@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  constructor() { }

  signOut(): void { window.sessionStorage.clear(); }

  // Cart specific methods
  public saveCart(cartItems: any[]): void {
    window.sessionStorage.removeItem(CART_KEY);
    window.sessionStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }

  public getCart(): any[] {
    const cart = window.sessionStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
  }

  public clearCart(): void {
    window.sessionStorage.removeItem(CART_KEY);
  }


  public saveToken(token: string): void { window.sessionStorage.removeItem(TOKEN_KEY); window.sessionStorage.setItem(TOKEN_KEY, token); }
  public getToken(): any { return window.sessionStorage.getItem(TOKEN_KEY); }
  //--------------------------------------------------------------------------------

  public saveUser(user: any): void { window.sessionStorage.removeItem(USER_KEY); window.sessionStorage.setItem(USER_KEY, JSON.stringify(user)); }
  public getUser(): any { const user = window.sessionStorage.getItem(USER_KEY); if (user) { return JSON.parse(user); } return {}; }
  //--------------------------------------------------------------------------------

  public saveOrganisation(entite: string): void { window.sessionStorage.removeItem(ORG_KEY); window.sessionStorage.setItem(ORG_KEY, entite); }
  public getOrganisation(): any { return window.sessionStorage.getItem(ORG_KEY); }
  //--------------------------------------------------------------------------------

  public saveActiveItem(item: string): void { window.sessionStorage.removeItem(MENU_KEY); window.sessionStorage.setItem(MENU_KEY, item); }

  public getActiveItem() { return window.sessionStorage.getItem(MENU_KEY); }
  //--------------------------------------------------------------------------------

  public saveActiveLang(item: string): void { window.sessionStorage.removeItem(LANG_KEY); window.sessionStorage.setItem(LANG_KEY, item); }
  public getActiveLang() { let res: any; if (window.sessionStorage.getItem(LANG_KEY) == null) { res = 'fr' } else { res = window.sessionStorage.getItem(LANG_KEY); } return res; }

  //--------------------------------------------------------------------------------
  public saveRole(roles: string[]): void { this.saveItems('R', roles); }

  public getRoles(): string[] { return this.getItems('R'); }

  //--------------------------------------------------------------------------------

  public savePermission(permissions: string[]): void { this.saveItems('P', permissions); }

  public getPermission(): string[] { return this.getItems('P'); }

  //--------------------------------------------------------------------------------

  private saveItems(keyPrefix: string, items: string[]): void {
    // Nettoyer les anciens éléments
    let i = 0;
    while (window.sessionStorage.getItem(`${keyPrefix}${i + 1}`)) { window.sessionStorage.removeItem(`${keyPrefix}${++i}`); }
    // Sauvegarder les nouveaux éléments
    items.forEach((item, index) => { window.sessionStorage.setItem(`${keyPrefix}${index + 1}`, item); });
  }

  private getItems(keyPrefix: string): string[] {
    const items: string[] = []; let i = 1;
    while (window.sessionStorage.getItem(`${keyPrefix}${i}`)) {
      const item = window.sessionStorage.getItem(`${keyPrefix}${i}`); if (item !== null) { items.push(item); } i++;
    }
    return items;
  }
  //--------------------------------------------------------------------------------
  getAll() {
    console.log(this.getRoles());
    console.log(this.getUser());
  }

}
