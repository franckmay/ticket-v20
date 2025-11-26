import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Groupe } from '../../class/groupe';
import { Permission } from '../../class/role/permission';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { FindParam } from '../../class/dto/find-param';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth/_services/auth.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule
  ]
})
export class MainComponent implements OnInit, AfterViewInit {
  
  notifications: any[] = [];
  permissions: string[] = [];
  
  // États UI
  waiter = false;
  loading = false;
  showLogout = false;
  activeItem: string | null = '';
  currentLang: string = 'fr';
  
  fparam: any;

  constructor(
    private router: Router, 
    public translate: TranslateService, 
    private auth: AuthService,
    private ts: SessionStorageService, 
    private api: ApiService
  ) {
    // Initialisation Langue
    const browserLang = this.translate.getBrowserLang() || 'fr';
    this.currentLang = browserLang;
    this.translate.setDefaultLang(browserLang);
    this.translate.use(browserLang);

    // Initialisation Permissions & Params
    this.permissions = this.ts.getRoles();
    this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser()?.login);
  }

  ngOnInit() {
    this.getActiveItem();
    // Si l'utilisateur est connecté mais qu'on n'a pas ses détails complets, on les recharge
    if (this.ts.getUser()?.login) {
      // Optionnel: On peut rafraichir les infos utilisateur ici si nécessaire
      // this.utilisateurfetch(); 
    } else {
       // Si pas connecté, rediriger (optionnel selon guard)
    }
  }

  ngAfterViewInit() { }

  // --- Gestion Navigation & UI ---

  changeLanguage(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
  }

  setActiveMenu(item: string) { 
    this.activeItem = item; 
    this.ts.saveActiveItem(item); 
  }

  getActiveItem() { 
    this.activeItem = this.ts.getActiveItem(); 
  }

  openCreateModal() {
    console.log("Ouverture modale création...");
    // Logique pour ouvrir une modale de création globale (Ticket, Projet, etc.)
  }
  
  goHome() { 
    this.setActiveMenu('home');
    this.router.navigate(['/home']); 
  }

  // --- Authentification & Permissions ---

  habilitation(code: string): boolean { 
    // Vérification simplifiée des permissions
    return this.permissions.includes(code); 
  }

  utilisateurfetch() {
    this.loading = true;
    if(!this.fparam.login) return; 

    this.auth.userDetails(this.fparam).subscribe({
      next: (data: any) => { 
        this.loading = false; 
        this.actualiser(data); 
      },
      error: (error: any) => { 
        console.error(error); 
        this.loading = false; 
      }
    });
  }

  actualiser(data: any) {
    if (data && data.utilisateur) {
      this.waiter = true;
      
      this.ts.saveRole(data.roles);
      this.ts.saveOrganisation(data.utilisateur.organisationID);
      this.ts.saveUser(data.utilisateur);

      const roles = data.roles?.map((p: Groupe) => p.code).filter((c: string) => !!c) || [];
      const codes = data.permissions?.map((p: Permission) => p.code).filter((c: string) => !!c) || [];

      if (roles.length > 0) this.ts.saveRole(roles);
      if (codes.length > 0) this.ts.savePermission(codes);

      this.permissions = [...roles, ...codes]; // Mise à jour locale immédiate

      setTimeout(() => { this.waiter = false; }, 1000);
    }
  }

  // --- Déconnexion ---

  confirmLogout() { this.showLogout = true; }
  closeLogout() { this.showLogout = false; }

  logout() { 
    this.showLogout = false; 
    this.ts.signOut(); 
    this.router.navigate(['/']); 
  }

  // --- Notifications ---
  
  handleNotificationClick(notification: any) {
    if (notification.route) {
      this.router.navigate([notification.route]);
    }
  }

}