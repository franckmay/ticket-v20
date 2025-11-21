import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Important pour le <router-outlet>
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
    RouterModule, // Essentiel pour la navigation (RouterLink, RouterOutlet)
    TranslateModule
  ]
})
export class MainComponent {
  notifications: any[] = [];


  waiter = false;
  loading = false;
  activated = false;
  showLogout = false;
  activeItem: string | null = '';
  fparam: any;
  currentLang: string = 'fr';
  constructor(private router: Router, public translate: TranslateService, private auth: AuthService,
    private ts: SessionStorageService, private api: ApiService) {
    const browserLang = this.translate.getBrowserLang() || 'fr';
    this.currentLang = browserLang;
    this.translate.setDefaultLang(browserLang);
    this.translate.use(browserLang);
    this.permissions = this.ts.getRoles();
    this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser().login);
  }

  ngOnInit() {
    this.getActiveItem();
    if (!this.ts.getUser().login) {
      this.utilisateurfetch();
    }
    //this.getNotifications();
  }

  ngAfterViewInit() { }
  //--------------------------------------------------------------------------------
  changeLanguage(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
  }
  //--------------------------------------------------------------------------------


  // Gestion du clic sur une notification
  handleNotificationClick(notification: any) {
    if (notification.route) {
      this.router.navigate([notification.route]); // Naviguer vers la route associée
    } else {
      console.log('Notification clicked:', notification);
      // Effectuer une autre action si nécessaire
    }
  }
  //--------------------------------------------------------------------------------

  utilisateurfetch() {
    this.loading = true;
    this.auth.userDetails(this.fparam).subscribe({
      next: (data: any) => { this.loading = false; this.actualiser(data); },
      error: (error: any) => { console.error(error); this.loading = false; }
    });
  }

  actualiser(data: any) {
    if (data && data.utilisateur) {

      this.waiter = true;
      // Stocker les informations utilisateur et autres données
      this.ts.saveRole(data.roles);
      this.ts.saveOrganisation(data.utilisateur.organisationID);
      this.ts.saveUser(data.utilisateur);

      // Extraire tous les codes des roles
      const roles = data.roles?.map((permission: Groupe) => permission.code).filter((code: string) => !!code) || [];

      // Extraire tous les codes des permissions (avec un type explicite pour permission)
      const codes = data.permissions?.map((permission: Permission) => permission.code).filter((code: string) => !!code) || [];

      // Sauvegarder tous les codes en une seule fois
      if (roles.length > 0) { this.ts.saveRole(roles); }
      if (codes.length > 0) { this.ts.savePermission(codes); }

      setTimeout(() => {
        this.waiter = false;

      }, 1500);
    } else {
      console.warn('Données invalides ou utilisateur manquant:', data);
    }
  }
  //--------------------------------------------------------------------------------

  // Déconnexion
  confirmLogout() { this.showLogout = true; }

  closeLogout() { this.showLogout = false; }

  logout() { this.showLogout = false; this.ts.signOut(); this.router.navigate(['/']); }
  //--------------------------------------------------------------------------------

  goHome() { this.router.navigate(['/']); }

  openMessages() { this.router.navigate(['/messages']); }
  //--------------------------------------------------------------------------------

  setActiveMenu(item: string) { this.activeItem = item; this.ts.saveActiveItem(item); }

  getActiveItem() { this.activeItem = this.ts.getActiveItem(); }

  //--------------------------------------------------------------------------------
  permissions: string[] = []
  habilitation(code: string): boolean { return this.permissions.includes(code); }

  //--------------------------------------------------------------------------------

}