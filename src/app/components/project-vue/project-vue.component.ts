import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { SplitterModule } from 'primeng/splitter';

// Services & Models
import { FindParam } from '../../class/dto/find-param';
import { Organisation } from '../../class/organisation';
import { Priorite } from '../../class/priorite';
import { Projets } from '../../class/projets';
import { Ticket } from '../../class/ticket';
import { ApiService } from '../../services/api.service';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { ModalService } from '../../layout/modalService';

// Composants Standalone
import { ProjetEditComponent } from "../../fragments/projet-edit/projet-edit.component";
import { TicketDetailComponent } from "../../fragments/ticket-detail/ticket-detail.component";
import { TicketEditComponent } from "../../fragments/ticket-edit/ticket-edit.component";
import { TicketMembreListComponent } from "../../fragments/ticket-membre-list/ticket-membre-list.component";

@Component({
  selector: 'app-project-vue',
  templateUrl: './project-vue.component.html',
  styleUrls: ['./project-vue.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    DialogModule,
    SplitterModule,
    ProjetEditComponent,
    TicketDetailComponent,
    TicketEditComponent,
    TicketMembreListComponent
  ]
})
export class ProjectVueComponent implements OnInit {

  // Injections
  private api = inject(ApiService);
  privatets = inject(SessionStorageService); // Note: renamed to fix potential 'ts' name collision if used directly
  private modalService = inject(ModalService);
  public translate = inject(TranslateService);
  private sessionService = inject(SessionStorageService);

  // Données
  projets: Projets[] = [];
  modules: Ticket[] = [];
  userStories: Ticket[] = [];
  taches: Ticket[] = [];

  filteredModules: Ticket[] = [];
  filteredUserStories: Ticket[] = [];
  filteredTaches: Ticket[] = [];

  organisations: Organisation[] = [];
  selectedProjet!: Projets;
  newProject = new Projets();
  
  selectedModule?: Ticket;
  selectedUS?: Ticket;
  ticket?: Ticket;
  
  priorites: Priorite[] = []; 
  types: any[] = [];

  ticketToDeleteId?: string
  deleteProjectDialog = false;
  deleteDialog = false;
  affectationDialog = false;
  loading = false;
  
  fparam: FindParam;
  user: any;
  showInterface = 1

  viewMode: 'list' | 'cards' = 'list';
  selectedStatus = 20; // Par défaut 'En cours'
  
  statuses = [
    { value: 0, label: 'Tous' },
    { value: 10, label: 'En attente' },
    { value: 20, label: 'En cours' },
    { value: 30, label: 'Bloqué' }, // J'ai renommé pour 'Réouvert/Bloqué' souvent rouge/info
    { value: 40, label: 'Résolu' },
    { value: 50, label: 'Fermé' }
  ];

  displayDialog = false
  dialogView: 'detail' | 'edition' = 'detail';

  constructor() {
    this.fparam = new FindParam(this.sessionService.getOrganisation(), this.sessionService.getUser().login);
    this.user = this.sessionService.getUser();
  }

  ngOnInit(): void {
    this.listOrganisation();
    this.listPriorite();
    // this.loadProjets(); // Souvent chargé au clic sur rechercher ou init
  }

  // --- CHARGEMENTS ---
  listPriorite() { 
    this.api.prioriteList().subscribe(data => this.priorites = data); 
  }
  
  listTypeTicket() {
    this.api.typeTicketList().subscribe({
        next: (data) => { this.types = data; },
        error: (err) => console.error(err),
    });
  }
  
  listOrganisation() {
    this.api.organisationList().subscribe({
      next: (data) => { this.organisations = data; },
      error: (err) => console.error(err.error),
    });
  }

  loadProjets(): void {
    this.loading = true;
    this.api.projetList({ ...this.fparam }).subscribe({
      next: data => { 
        this.projets = data; 
        this.loading = false; 
        // Reset selections
        this.selectedProjet = undefined!;
        this.resetFilters();
      },
      error: err => { 
        console.error(err); 
        this.loading = false;
        this.modalService.showStatusModal('error', 'Erreur', 'Impossible de charger les projets');
      }
    });
  }

  // --- SELECTION LOGIC ---

  onSelectProjet(p: Projets): void {
    this.selectedProjet = p;
    this.resetFilters(1); // Reset tout sauf projet
    this.loadModules(p.projetID);
  }

  onSelectModule(m: Ticket): void {
    this.selectedModule = m;
    this.resetFilters(2); // Reset niveaux inférieurs
    this.loadUserStories(m.ticketID);
  }

  onSelectUS(us: Ticket): void {
    this.selectedUS = us;
    this.loadTaches(us.ticketID);
  }

  resetFilters(level: number = 0) {
      if(level < 1) { 
        this.modules = []; this.filteredModules = []; this.selectedModule = undefined; 
      }
      if(level < 2) { 
        this.userStories = []; this.filteredUserStories = []; this.selectedUS = undefined; 
      }
      if(level < 3) { 
        this.taches = []; this.filteredTaches = []; 
      }
  }

  // --- API CALLS CASCADES ---

  loadModules(projetID?: string): void {
    if (!projetID) return;
    this.loading = true;
    this.api.ticketsListBy({ niveau: 1, projetID }).subscribe({
      next: data => { 
          this.modules = data; 
          this.filteredModules = data; 
          this.loading = false; 
      },
      error: err => { console.error(err); this.loading = false; }
    });
  }

  loadUserStories(parentID?: string): void {
    if (!parentID) return;
    this.loading = true;
    this.api.ticketsListBy({ niveau: 2, parentID }).subscribe({
      next: data => { 
          this.userStories = data; 
          this.filteredUserStories = data; 
          this.loading = false; 
      },
      error: err => { console.error(err); this.loading = false; }
    });
  }

  loadTaches(parentID?: string): void {
    if (!parentID) return;
    this.loading = true;
    this.api.ticketsListBy({ niveau: 3, parentID }).subscribe({
      next: data => { 
          this.taches = data; 
          this.filteredTaches = data; 
          this.loading = false; 
      },
      error: err => { console.error(err); this.loading = false; }
    });
  }

  // --- ACTIONS UI ---

  openDetailProjet(p: Projets): void { this.showInterface = 2; }

  editProjet(p?: Projets) {
    if (p) { 
        this.selectedProjet = p;
        this.newProject = { ...p };
    } else { 
        this.newProject = { ...new Projets(), organisationID: this.fparam.organisationID };
    }
    this.showInterface = 2;
  }

  closeProjectView(event?: any) { 
      if (event) { this.loadProjets(); } 
      this.newProject = new Projets(); 
      this.showInterface = 1; 
  }

  // --- MODALS & EDITIONS ---

  openTicketDetails(ticket: Ticket): void {
    this.ticket = { ...ticket };
    this.dialogView = 'detail';
    this.displayDialog = true;
  }

  openAffectation(ticket: Ticket): void {
    this.ticket = { ...ticket };
    this.affectationDialog = true;
  }

  closeAffectation() { this.affectationDialog = false }

  editTicket(n: number, ticket?: Ticket): void {
    if (ticket) {
      this.ticket = { ...ticket };
    } else {
      const pID = n === 2 ? this.selectedModule?.ticketID : n === 3 ? this.selectedUS?.ticketID : undefined;
      // Sécurité : ne pas créer si pas de parent sélectionné (sauf niveau 1)
      if (n > 1 && !pID) {
          this.modalService.showStatusModal('error', 'Action impossible', 'Veuillez sélectionner un parent d\'abord.');
          return;
      }
      this.ticket = { ...new Ticket(), niveau: n, parentID: pID!, projetID: this.selectedProjet?.projetID };
    }
    this.dialogView = 'edition';
    this.displayDialog = true;
    this.loading = false;
  }

  closeDialog(t?: any) { 
      if (t) { this.reloadAfterEdit(); } 
      this.displayDialog = false; 
      this.ticket = undefined; 
  }

  reloadAfterEdit() {
    // Rechargement intelligent selon le niveau
    if(this.ticket?.niveau === 1 || !this.ticket?.parentID) {
         this.loadModules(this.selectedProjet?.projetID);
    } else if (this.ticket?.niveau === 2) {
         this.loadUserStories(this.selectedModule?.ticketID);
    } else if (this.ticket?.niveau === 3) {
         this.loadTaches(this.selectedUS?.ticketID);
    }
  }

  // --- SUPPRESSIONS ---

  confirmDeleteProject(item: Projets) { 
      this.selectedProjet = { ...item }; 
      this.deleteProjectDialog = true; 
  }

  deleteProject() {
    this.deleteProjectDialog = false;
    this.loading = true;
    this.api.projetDelete(this.selectedProjet.projetID).subscribe({
      next: data => { 
          this.loading = false; 
          this.modalService.showStatusModal('success', 'Suppression', 'Projet supprimé.');
          this.loadProjets(); 
      },
      error: err => { 
          console.error(err.error); 
          this.loading = false; 
          this.modalService.showStatusModal('error', 'Erreur', 'Impossible de supprimer le projet.');
      }
    });
  }

  confirmDelete(t: Ticket): void {
    this.ticket = t;
    this.ticketToDeleteId = t.ticketID;
    this.deleteDialog = true;
  }

  deleteTicket(): void {
    if (!this.ticketToDeleteId) return;
    this.loading = true;
    this.api.ticketsDelete(this.ticketToDeleteId).subscribe({
      next: () => {
        this.loading = false; 
        this.deleteDialog = false; 
        this.modalService.showStatusModal('success', 'Succès', 'Ticket supprimé.');
        this.reloadAfterEdit();
        this.ticketToDeleteId = undefined;
      },
      error: (err) => { 
          console.error(err); 
          this.loading = false; 
          this.deleteDialog = false;
          this.modalService.showStatusModal('error', 'Erreur', 'Echec de la suppression.');
      },
    });
  }

  // --- HELPERS VISUELS ---

  getBadgeClass(priority: number | undefined): string {
      if(!priority && priority !== 0) return 'priority-low'; // Default
      if(priority >= 6) return 'priority-high';
      if(priority >= 4) return 'priority-med';
      return 'priority-low';
  }

  getStatusBadge(status: number | undefined): string {
      switch(status) {
          case 10: return 'status-waiting';
          case 20: return 'status-progress';
          case 30: return 'status-blocked';
          case 40: return 'status-done';
          case 50: return 'status-waiting'; // Closed
          default: return 'status-waiting';
      }
  }
}