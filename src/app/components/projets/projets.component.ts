import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG Imports (Déduits de l'usage)
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table'; // Probablement utilisé pour la liste
import { ToastModule } from 'primeng/toast';

// Services & Models
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { Organisation } from '../../class/organisation';
import { ApiService } from '../../services/api.service';
import { TokenStorageService } from '../../services/auth/_services/token-storage.service';
import { Action } from '../../enum/action.enum';
import { Projets } from '../../class/projets';
import { Proprietaire } from '../../class/proprietaire';
import { User } from '../../class/user';
import { Priorite } from '../../class/priorite';
import { ProjetRole } from '../../class/projetrole';
import { FindParam } from '../../class/dto/find-param';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { ProjetEquipe } from '../../class/projet-equipe';
import { ProjetMembre } from '../../class/projet-membre';
import { Ticket } from '../../class/ticket';
import { ProjetEditComponent } from "../../fragments/projet-edit/projet-edit.component";
import { Menu } from "primeng/menu";import { TabsModule } from 'primeng/tabs';


@Component({
  selector: 'app-projets',
  templateUrl: './projets.component.html',
  styleUrls: ['./projets.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    // PrimeNG
    DialogModule,
    ButtonModule,
    ConfirmDialogModule,
    TooltipModule,
    ProgressSpinnerModule,
    TableModule,
    DynamicDialogModule,
    ToastModule,
    ProjetEditComponent,
    Menu,
    TabsModule
],
  providers: [DialogService, ConfirmationService] // Services locaux nécessaires
})
export class ProjetsComponent implements OnInit {


  currentAction = 'edit';


  handleSaveProjet(savedProjet: Projets) {
    this.projet = new Projets()
    this.listProjet()
    this.getPageByAction(Action.LIST);
    // Remplacement de alert() par une méthode UI plus propre si possible, sinon window.alert
    window.alert("succes insertion");
    console.log('Projet saved:', savedProjet);
  }




  handleBack() {
    this.pageByAction = Action.LIST;
    this.projet = new Projets();
    this.projetequipe = new ProjetEquipe();
    this.projetmembre = new ProjetMembre();
    this.projetmembrerole = new ProjetRole();
    this.module = new Ticket();
    this.projetequipes = [];
    this.modules = [];
  }



  organisation: Organisation = new Organisation();
  proprietaire: Proprietaire = new Proprietaire();
  projetequipe: ProjetEquipe = new ProjetEquipe();
  projetmembre: ProjetMembre = new ProjetMembre();
  projetmembrerole: ProjetRole = new ProjetRole();
  projetequipes: ProjetEquipe[] = [];
  priorites: Priorite[] = [];
  projetmembres: ProjetMembre[] = [];
  projetmembresOrg: ProjetMembre[] = [];
  membreroles: ProjetRole[] = [];
  organisations: Organisation[] = [];
  proprietaires: Proprietaire[] = [];
  proprietairesOrg: Proprietaire[] = [];
  projet: Projets = new Projets();
  projets: Projets[] = [];
  projetsAll: Projets[] = [];
  user: User = new User();
  users: User[] = [];
  action = '';
  pageByAction = Action.LIST
  actionPJ = 'newPJ';
  acte = 1;
  options: any[] = [];
  actionOb = '';
  displaySpinner: boolean = false;
  deleteProjectDialog = false
  addRoleDialog = false
  deleteDialogEP = false

  deleteDialogMod = false
  deleteDialogMembre = false
  teamDialog = false
  membreDialog = false
  newMembreDialog = false
  selectedMembre: any;
  etat: number | null = null;
  status: number | null = null;
  displayAffecter = false
  organisationAffectees: Organisation[] = []
  selectedPa: any[] = [];
  selectedMem: any[] = [];
  module: Ticket = new Ticket();
  modules: Ticket[] = [];

  optionsStatus = [
    { value: '10', label: 'enattente' },
    { value: '20', label: 'encours' },
    { value: '30', label: 'Réouvert' },
    { value: '40', label: 'Résolu' },
    { value: '50', label: 'Fermé' },

  ];
  optionsEtat = [
    { value: '10', label: 'enattente' },
    { value: '20', label: 'encours' },
    { value: '30', label: 'Réouvert' },
    { value: '40', label: 'Résolu' },
    { value: '50', label: 'Fermé' },

  ];
  fparam: any;

  constructor(
    private api: ApiService,
    private ts: SessionStorageService,
    public translate: TranslateService,
    public route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private confirmationService: ConfirmationService,
    public dialogService: DialogService) { this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser().login); }

  ngOnInit() { this.listProjet(); this.listOrganisation(); this.listPriorite(); this.proprietaireListByOrg(this.ts.getOrganisation()) }

  reload() { this.listProjet() }
  reloadMem() { this.listMembreByEquipe(this.fparam.projetequipeID) }

  listOrganisation() {
    this.api.organisationList().subscribe((data) => {
      this.organisations = data;
      if (data.length == 1) {
        this.organisation = data[0];
      }
    });
  }
  //------------------------------------------------------------------------------------------------------------------------------------
  listProjet() {
    this.displaySpinner = true;
    this.api.projetList({ ...this.fparam }).subscribe({
      next: data => { this.projets = data; this.displaySpinner = false; }, 
      error: err => { console.error(err); this.displaySpinner = false; }
    });
  }
  //------------------------------------------------------------------------------------------------------------------------------------

  listMembre() { this.displaySpinner = true; this.api.membreList(this.fparam.organisationID || '').subscribe((data) => { this.users = data; this.displaySpinner = false; }); }
  //------------------------------------------------------------------------------------------------------------------------------------

  listPriorite() { this.api.prioriteList().subscribe((data) => { this.priorites = data; }); }
  //------------------------------------------------------------------------------------------------------------------------------------
  membreRoleList() {
    this.displaySpinner = true;
    this.api.membreRoleList().subscribe((data) => { this.membreroles = data; this.displaySpinner = false; });
  }
  //------------------------------------------------------------------------------------------------------------------------------------

  listMembreByEquipe(projetequipeID: string) {
    this.displaySpinner = true;
    this.fparam.projetequipeID = projetequipeID;
    this.api.membreListByEquipe({ organisationID: this.fparam.organisationID, projetequipeID: projetequipeID }).subscribe((data) => {
      this.projetmembres = data; this.displaySpinner = false;
    });
  }
  listMembreByOrg() {
    this.displaySpinner = true;
    this.api.membreListByEquipe({ organisationID: this.fparam.organisationID }).subscribe((data) => {
      this.projetmembresOrg = data; this.displaySpinner = false;
    });
  }
  //------------------------------------------------------------------------------------------------------------------------------------
  proprietaireListByOrg(organisationID: string) {
    this.displaySpinner = true;
    this.api.proprietaireListByOrg(organisationID).subscribe((data) => {
      this.proprietairesOrg = data;


      this.displaySpinner = false
    });
  }
  projetEquipeList(projetID: string) {
    this.displaySpinner = true;
    this.api.projetEquipeList({ projetequipeID: this.fparam.projetequipeID, projetID: projetID, proprietaireID: this.fparam.proprietaireID, organisationID: this.fparam.organisationID }).subscribe((data) => {
      this.projetequipes = data;
      this.displaySpinner = false;

    });
  }
  proprietaireList() {
    this.displaySpinner = true;
    this.api.proprietaireList().subscribe((data) => {
      this.proprietaires = data;
      this.displaySpinner = false;
    });
  }
  //------------------------------------------------------------------------------------------------------------------------------------


  getPageByAction(action: Action) { this.pageByAction = action; }

  backToList(niveau: number) { this.projet = new Projets(); this.acte = niveau; switch (niveau) { case 1: this.getPageByAction(Action.LIST); break; default: break; } }
  //----------------------------------------

  create() {
    this.currentAction = 'new';
    //this.actionPJ = 'newPJ'; 
    this.projet = new Projets();
    this.projet.projetID = this.generateUniqueProjetID();
    this.projetequipes = [];
    this.pageByAction = Action.CREATEPJ;
    if (this.organisation?.organisationID) {
      this.proprietaireListByOrg(this.organisation.organisationID);
    }
    this.acte = 1;
  }

  generateUniqueProjetID(): string {
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '')
      .replace(/\..*$/, '');
    const randomSuffix = `${Math.floor(Math.random() * 1000)}.${Math.floor(Math.random() * 1000)}`;
    return `PROJ${timestamp}.${randomSuffix}`;
  }
  //----------------------------------------
  createTeam() {
    this.projetequipe = new ProjetEquipe();
    this.projetequipe.projetequipeID = `PROJEP${new Date().toISOString().replace(/[-:]/g, '').replace('T', '').replace(/\..*$/, '')}.${Math.floor(Math.random() * 1000)}.${Math.floor(Math.random() * 1000)}`;
    this.teamDialog = true
  }

  closeDialogTeam() { this.teamDialog = false; this.projetequipe = new ProjetEquipe(); }
  //----------------------------------------

  openMembre(pj: ProjetEquipe) {
    this.projetequipe = { ...pj };
    this.membreDialog = true;
    this.membreRoleList()
    this.fparam.projetequipeID = pj.projetequipeID;
    this.listMembreByEquipe(pj.projetequipeID)
  }

  closeDialogMembre() { this.membreDialog = false }
  //----------------------------------------
  createMembre() { this.newMembreDialog = true; this.user = new User(); }
  //----------------------------------------
  closeDialogCreateMembre() { this.newMembreDialog = false; this.user = new User(); }
  //----------------------------------------

  //----------------------------------------

  saveMembre() {
    this.user.user_update = this.ts.getUser().login;
    this.displaySpinner = true;
    this.api.membreInsert(this.user).subscribe(data => {
      this.displaySpinner = false;
      this.user = new User()
      this.listMembre()
      this.showSuccesDialog("succes insertion");
    }, error => {
      console.log(error.error)
      this.displaySpinner = false;
      this.showErrorDialog("erreur register");
    })
  }

  saveTeam() {
    this.projetequipe.user_update = this.ts.getUser().login;
    this.projetequipe.projetID = this.projet.projetID;
    this.projetequipe.proprietaireID = this.projet.proprietaireID;
    this.projetequipe.organisationID = this.projet.organisationID;
    this.displaySpinner = true;
    console.log(this.projetequipe);
    this.api.projetEquipeInsert(this.projetequipe).subscribe(data => {
      this.displaySpinner = false;
      this.projetEquipeList(this.projet.projetID)
      this.teamDialog = false;
      window.alert("succes insertion");
      //this.showSuccesDialog("succes insertion");
    }, error => {
      console.log(error.error)
      this.displaySpinner = false;
      window.alert("erreur lors d'insertion");
      //  this.showErrorDialog("erreur register");
    })
  }

  saveProjet() {
    this.projet.user_update = this.ts.getUser().login;
    this.displaySpinner = true;
    console.log(this.projet);
    this.api.projetInsert(this.projet).subscribe(data => {
      this.displaySpinner = false;
      this.projet = new Projets()
      this.getPageByAction(Action.LIST);
      window.alert("succes insertion");

      // this.showSuccesDialog("succes insertion");
    }, error => {
      console.log(error.error)
      this.displaySpinner = false;
      window.alert("erreur lors d'insertion");
      //this.showErrorDialog("erreur register");
    })
  }

  //====================================================================================================
  confirmDelete(item: Projets) { this.projet = { ...item }; this.deleteProjectDialog = true; }
  //----------------------------------------

  deletePJE(pj: ProjetEquipe) { this.projetequipe = { ...pj }; this.deleteDialogEP = true; }
  //----------------------------------------

  deleteMembre(pj: User) { this.user = { ...pj }; this.deleteDialogMembre = true; }
  //----------------------------------------

  deleteMod(pj: Ticket) { this.module = { ...pj }; this.deleteDialogMod = true; }
  //----------------------------------------


  deleteProject() {
    this.deleteProjectDialog = false;
    this.displaySpinner = true;
    this.api.projetDelete(this.projet.projetID).subscribe({
      next: data => {
        this.displaySpinner = false;
        this.getPageByAction(Action.LIST);
        this.reload();
      },
      error: err => { console.error(err.error);
       this.displaySpinner = false; this.showErrorDialog("Echec de la Suppression"); }
    });
  }


  getPJ(pj: Projets, currentAction: string) {
    this.currentAction = currentAction;
    this.projet = { ...pj };
    this.acte = 1;
    //this.actionPJ = currentAction === 'edit' ? 'editPJ' : currentAction === 'view' ? 'viewPJ' : 'newPJ';
    this.getPageByAction(Action.CREATEPJ);
    this.projetEquipeList(pj.projetID);
  }

  getPJE(pj: ProjetEquipe) {
    this.projetequipe = { ...pj };
    this.teamDialog = true;
  }
  getMembre(pj: ProjetMembre) {
    this.projetmembre = { ...pj }
    if (this.projetmembres && pj.nom) {
      this.selectedMembre = this.projetmembres.find(m => m.nom === pj.nom);
    }
    if (pj.roleID) {
      this.projetmembre.roleID = pj.roleID;
    }
    this.addRoleDialog = true
  }


  onDropdownPJ(pj: Projets) {
    this.projet = pj;
    this.options = [
      { label: "Consulter", icon: 'fas fa-eye', color: 'rgb(23, 74, 125)', command: () => { this.getPJ(pj, 'view') } },
      { label: 'Modifier', icon: 'fas fa-edit', color: 'rgb(23, 74, 125)', command: () => { this.getPJ(pj, 'edit') } },
      { separator: true },
      { label: "Supprimer", icon: 'fas fa-trash', pTooltip: "Actions groupés", color: '#ce2727', command: () => { this.confirmDelete(pj); } },
    ];
  }

  resetFilters() {
    this.fparam = {
      organisationID: undefined,
      proprietaireID: undefined,
      etat: undefined,
      status: undefined,
      dateDebut: undefined,
      dateFin: undefined
    };
    this.proprietairesOrg = [];
  }

  lastSavedSelections: { [key: string]: any[] } = {};




  closeDialogAffecter() { this.displayAffecter = false; this.organisationAffectees = []; this.selectedPa = []; }

  onRowSelectOrg(event: any) { this.listOrganisation(); console.log(this.organisationAffectees); }
  onRowUnselect(event: any) { }


  computeDuree(): void {
    if (this.projet.dateDebut && this.projet.dateFin) {
      const d1 = new Date(this.projet.dateDebut);
      const d2 = new Date(this.projet.dateFin);
      const diffMs = d2.getTime() - d1.getTime();
      const jours = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (jours < 0) {
        this.projet.duree = '';
        return;
      }

      if (jours >= 30) {
        const mois = Math.floor(jours / 30);
        const resteJours = jours % 30;
        let duree = [];
        if (mois > 0) {
          duree.push(`${mois} mois`);
        }
        if (resteJours > 0) {
          duree.push(`${resteJours} jour${resteJours > 1 ? 's' : ''}`);
        }
        this.projet.duree = duree.join(' et ');
      } else {
        this.projet.duree = jours === 0 ? '0 jour' : `${jours} jour${jours > 1 ? 's' : ''}`;
      }
    } else {
      this.projet.duree = '';
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 10: return this.translate.instant('enattente');
      case 20: return this.translate.instant('encours');
      case 30: return this.translate.instant('Réouvert');
      case 40: return this.translate.instant('Résolu');
      case 50: return this.translate.instant('Fermé');
      default: return '';
    }
  }

  getStatusSeverity(status: number): string {
    switch (status) {
      case 10: return 'warning';
      case 20: return 'info';
      case 30: return 'success';
      case 40: return 'primary';
      case 50: return 'danger';
      default: return '';
    }
  }

  getEtatLabel(etat: number): string {
    switch (etat) {
      case 10: return this.translate.instant('enattente');
      case 20: return this.translate.instant('encours');
      case 30: return this.translate.instant('Réouvert');
      case 40: return this.translate.instant('Résolu');
      case 50: return this.translate.instant('Fermé');
      default: return '';
    }
  }

  getEtatSeverity(etat: number): string {
    switch (etat) {
      case 10: return 'warning';
      case 20: return 'info';
      case 30: return 'success';
      case 40: return 'primary';
      case 50: return 'danger';
      default: return '';
    }
  }

  verifyLength(valeur: any) { let val = '' + valeur; if (val.toString().length >= 30) { return true; } return false; }

  defineDescription(libelle: any): string { return libelle.slice(0, 29); }

  truncateText(text: string, maxWords: number = 25): string {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    return words.length > maxWords
      ? words.slice(0, maxWords).join(' ') + '...'
      : text;
  }

  isTruncated(text: string, maxWords: number = 25): boolean {
    if (!text) return false;
    return text.trim().split(/\s+/).length > maxWords;
  }


  //------------------------------------------------------------------------------------------------
  successMessage = ''; displaySucces = false; errorMessage = ''; displayError = false;
  showSuccesDialog(message: string) { this.successMessage = message; this.displaySucces = true; }
  closeSucces() { this.displaySucces = false; }

  showErrorDialog(message: string) { this.errorMessage = message; this.displayError = true; }
  closeError() { this.displayError = false; }

}