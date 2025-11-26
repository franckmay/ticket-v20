import { Component, OnInit, inject } from '@angular/core'; // "inject" est moderne
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators'; // Pour gérer le loading proprement

// PrimeNG
import { SplitterModule } from 'primeng/splitter';
import { DialogModule } from 'primeng/dialog';

// Nouveaux Services Modulaires
import { ProjetService } from '../../services/projet.service';
import { TicketService } from '../../services/ticket.service';
import { OrganisationService } from '../../services/organisation.service';
import { SprintService } from '../../services/sprint.service';
import { SessionStorageService } from '../../services/session/session-storage.service';

// Models
import { FindParam } from '../../class/dto/find-param';
import { Organisation } from '../../class/organisation';
import { Priorite } from '../../class/priorite';
import { Projets } from '../../class/projets';
import { Ticket } from '../../class/ticket';

// Composants Enfants
import { ProjetEditComponent } from '../../fragments/projet-edit/projet-edit.component';
import { TicketDetailComponent } from '../../fragments/ticket-detail/ticket-detail.component';
import { TicketEditComponent } from '../../fragments/ticket-edit/ticket-edit.component';
import { ProjetEquipeEditComponent } from '../../fragments/projet-equipe-edit/projet-equipe-edit.component';
import { TicketMembreListComponent } from '../../fragments/ticket-membre-list/ticket-membre-list.component';
import { SprintComponent } from '../../components/sprint/sprint.component';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    SplitterModule,
    DialogModule,
    ProjetEditComponent,
    TicketDetailComponent,
    TicketEditComponent,
    ProjetEquipeEditComponent,
    TicketMembreListComponent,
    SprintComponent
  ]
})
export class AccueilComponent implements OnInit {

  // Injections via constructeur ou inject()
  constructor(
    private projetService: ProjetService,
    private ticketService: TicketService,
    private organisationService: OrganisationService,
    private sprintService: SprintService, // Utilisé indirectement ou pour extensions futures
    private ts: SessionStorageService,
    public translate: TranslateService
  ) {
    const org = this.ts.getOrganisation ? this.ts.getOrganisation() : null;
    const user = this.ts.getUser ? this.ts.getUser() : { login: 'guest' };
    this.fparam = new FindParam(org, user.login);
    this.user = user;
  }

  // Données
  projets: Projets[] = [];
  modules: Ticket[] = [];
  userStories: Ticket[] = [];
  taches: Ticket[] = [];
  organisations: Organisation[] = [];
  priorites: Priorite[] = [];
  types: any[] = [];

  // États de sélection
  selectedProjet!: Projets;
  selectedModule?: Ticket;
  selectedUS?: Ticket;
  ticket?: Ticket;
  newProject = new Projets();

  // États d'affichage (Dialogs & Views)
  showInterface = 1; // 1: Dashboard, 2: Edit Projet
  dialogEquipes = false;
  dialogSprints = false;
  deleteProjectDialog = false;
  deleteDialog = false;
  affectationDialog = false;
  displayDialog = false;
  dialogView: 'detail' | 'edition' = 'detail';
  
  // Utilitaires
  loading = false;
  ticketToDeleteId?: string;
  fparam: any;
  user: any;

  ngOnInit(): void {
    this.loadInitialData();
  }

  /** Chargement des données de référence */
  loadInitialData(): void {
    // On pourrait utiliser forkJoin ici pour paralléliser, mais gardons simple pour l'instant
    this.organisationService.list().subscribe({
      next: (data) => this.organisations = data,
      error: (err) => console.error('Erreur organisations', err)
    });

    this.ticketService.getPriorites().subscribe({
      next: (data) => this.priorites = data,
      error: (err) => console.error('Erreur priorités', err)
    });

    this.ticketService.getTypes().subscribe({
      next: (data) => this.types = data,
      error: (err) => console.error('Erreur types', err)
    });

    this.loadProjets();
  }

  // --- PROJETS ---

  loadProjets(): void {
   // this.loading = true;
    // Utilisation du nouveau ProjetService
    this.projetService.list({ ...this.fparam })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: data => this.projets = data,
        error: err => console.error(err)
      });
  }

  onSelectProjet(p: Projets): void {
    this.selectedProjet = p;
    // Reset enfants
    this.selectedModule = undefined;
    this.selectedUS = undefined;
    this.userStories = [];
    this.taches = [];
    
    this.loadModules(p.projetID);
  }

  editProjet(p?: Projets): void {
    if (p) {
      this.selectedProjet = p;
      this.newProject = { ...p };
    } else {
      this.newProject = { ...new Projets(), organisationID: this.fparam.organisationID };
      this.selectedProjet = this.newProject;
    }
    this.showInterface = 2;
  }

  closeProjectView(saved?: Projets): void {
    if (saved?.projetID) { this.loadProjets(); }
    this.newProject = new Projets(); 
    // On ne reset pas forcément selectedProjet ici pour garder la UX fluide
    this.showInterface = 1;
  }

  confirmDeleteProject(item: Projets): void {
    this.selectedProjet = { ...item };
    this.deleteProjectDialog = true;
  }

  deleteProject(): void {
    this.loading = true;
    this.projetService.delete(this.selectedProjet.projetID)
      .pipe(finalize(() => {
        this.loading = false;
        this.deleteProjectDialog = false;
      }))
      .subscribe({
        next: () => this.loadProjets(),
        error: err => console.error(err)
      });
  }

  // --- TICKETS (Modules, US, Tâches) ---

  loadModules(projetID?: string): void {
    if (!projetID) return;
    this.loading = true;
    this.ticketService.list({ niveau: 1, projetID })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: data => this.modules = data,
        error: err => console.error(err)
      });
  }

  onSelectModule(m: Ticket): void {
    this.selectedModule = m;
    this.selectedUS = undefined;
    this.taches = [];
    this.loadUserStories(m.ticketID);
  }

  loadUserStories(parentID?: string): void {
    if (!parentID) return;
    this.loading = true;
    this.ticketService.list({ niveau: 2, parentID })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: data => this.userStories = data,
        error: err => console.error(err)
      });
  }

  onSelectUS(us: Ticket): void {
    this.selectedUS = us;
    this.loadTaches(us.ticketID);
  }

  loadTaches(parentID?: string): void {
    if (!parentID) return;
    this.loading = true;
    this.ticketService.list({ niveau: 3, parentID })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: data => this.taches = data,
        error: err => console.error(err)
      });
  }

  // --- ACTIONS TICKETS ---

  openTicketDetails(ticket: Ticket): void {
    this.ticket = { ...ticket };
    this.dialogView = 'detail';
    this.displayDialog = true;
  }

  editTicket(niveau: number, ticket?: Ticket): void {
    if (ticket) {
      this.ticket = { ...ticket };
    } else {
      // Création : on détermine le parent et le type par défaut
      const parentID = niveau === 2 ? this.selectedModule?.ticketID :
                       niveau === 3 ? this.selectedUS?.ticketID : undefined;

      const typeID = niveau === 2 ? this.selectedModule?.typeTicketID : // Héritage simple
                     niveau === 3 ? this.selectedUS?.typeTicketID : 'requirement'; // Default

      this.ticket = { 
        ...new Ticket(), 
        niveau, 
        parentID, 
        typeTicketID: typeID, 
        projetID: this.selectedProjet?.projetID 
      };
    }
    this.dialogView = 'edition';
    this.displayDialog = true;
  }

  closeDialog(saved?: boolean): void {
    if (saved) {
      this.reloadAfterEdit();
    }
    this.displayDialog = false;
    this.ticket = undefined;
  }

  reloadAfterEdit(): void {
    // Rechargement contextuel intelligent
    switch (this.ticket?.niveau) {
      case 1: this.loadModules(this.selectedProjet.projetID); break;
      case 2: this.loadUserStories(this.selectedModule?.ticketID); break;
      case 3: this.loadTaches(this.selectedUS?.ticketID); break; // Correction: parentID de tache est l'ID de l'US
    }
  }

  confirmDelete(t: Ticket): void {
    this.ticket = t;
    this.ticketToDeleteId = t.ticketID;
    this.deleteDialog = true;
  }

  deleteTicket(): void {
    if (!this.ticketToDeleteId) return;
    this.loading = true;
    this.ticketService.delete(this.ticketToDeleteId)
      .pipe(finalize(() => {
        this.loading = false;
        this.deleteDialog = false;
        this.ticketToDeleteId = undefined;
      }))
      .subscribe({
        next: () => this.reloadAfterEdit(),
        error: err => console.error(err)
      });
  }

  // --- MODALS SECONDAIRES ---

  openSprints(p: Projets): void { this.selectedProjet = { ...p }; this.dialogSprints = true; }
  closeSprints(): void { this.dialogSprints = false; }

  openEquipes(p: Projets): void { this.selectedProjet = { ...p }; this.dialogEquipes = true; }
  closeEquipes(): void { this.dialogEquipes = false; }

  openAffectation(ticket: Ticket): void { this.ticket = { ...ticket }; this.affectationDialog = true; }
  closeAffectation(): void { this.affectationDialog = false; }
}