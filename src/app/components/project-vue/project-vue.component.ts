import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

// Services & Models
import { FindParam } from '../../class/dto/find-param';
import { Organisation } from '../../class/organisation';
import { Priorite } from '../../class/priorite';
import { Projets } from '../../class/projets';
import { Ticket } from '../../class/ticket';
import { ApiService } from '../../services/api.service';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { Splitter } from "primeng/splitter";
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
    ButtonModule,
    Splitter,
    ProjetEditComponent,
    TicketDetailComponent,
    TicketEditComponent,
    TicketMembreListComponent
]
})
export class ProjectVueComponent {

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
  priorites: Priorite[] = []; types: any[] = [];

  ticketToDeleteId?: string
  deleteProjectDialog = false;
  deleteDialog = false;
  affectationDialog = false;
  loading = false;
  fparam: any;
  user: any;
  showInterface = 1

  viewMode: 'list' | 'cards' = 'list';
  selectedStatus = 20;
  statuses = [
    { value: 0, label: 'Tous' },
    { value: 10, label: 'En attente' },
    { value: 20, label: 'En cours' },
    { value: 30, label: 'Reouvert' },
    { value: 40, label: 'Resolu' },
    { value: 50, label: 'Fermé' }
  ];

  // visibilités des panels de filtre
  moduleFilterVisible = false;
  usFilterVisible = false;
  taskFilterVisible = false;

  // valeurs des filtres (0 = Tous)
  modulesStatusFilter = 0;
  usStatusFilter = 0;
  taskStatusFilter = 0;
  //---------------------------------------------------------------------------

  displayDialog = false
  dialogView: 'detail' | 'edition' = 'detail';

  constructor(private api: ApiService, private ts: SessionStorageService,
    public translate: TranslateService,) {
    this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser().login);
    this.user = this.ts.getUser();
  }

  ngOnInit(): void {
    this.listOrganisation();
    this.listPriorite();
    // this.loadProjets();
  }
  //------------------------------------------------------------------------------------------------------------------------------------

  listPriorite() { this.api.prioriteList().subscribe((data) => { this.priorites = data; }); }
  //------------------------------------------------------------------------------------------------------------------------------------  
  listTypeTicket(): void {
    this.api.typeTicketList().subscribe(
      {
        next: (data) => { this.types = data; },
        error: (err) => console.error(err),
      });
  }
  // ---------- -------------------- -------------------- ----------
  listOrganisation() {
    this.api.organisationList().subscribe({
      next: (data) => { this.organisations = data; },
      error: (err) => console.error(err.error),
    });
  }
  //------------------------------------------------------------------------------------------------------------------------------------

  loadProjets(): void {
    this.loading = true;
    this.api.projetList({ ...this.fparam }).subscribe({
      next: data => { this.projets = data; this.loading = false; },
      error: err => { console.error(err); this.loading = false; }
    });
  }
  //------------------------------------------------------------------------------------------------------------------------------------

  onSelectProjet(p: Projets): void {
    this.selectedProjet = p;
    this.selectedModule = undefined;
    this.selectedUS = undefined;
    this.filteredUserStories = [];
    this.filteredTaches = [];
    this.loadModules(p.projetID);
  }  //--------------------------

  onSelectModule(m: Ticket): void {
    this.selectedModule = m;
    this.selectedUS = undefined;
    this.filteredTaches = [];
    this.loadUserStories(m.ticketID);
  }  //--------------------------

  onSelectUS(us: Ticket): void {
    this.selectedUS = us;
    this.loadTaches(us.ticketID);
  }  //--------------------------

  // projet-vue.component.ts
  loadModules(projetID?: string): void {
    if (!projetID) { console.warn('loadModules appelé sans projetID valide'); return; }
    this.loading = true;
    this.api.ticketsListBy({ niveau: 1, projetID }).subscribe({
      next: data => { this.modules = data; this.filteredModules = data; this.loading = false; console.log(data) },
      error: err => { console.error(err); this.loading = false; }
    });
  }

  loadUserStories(parentID?: string): void {
    if (!parentID) return;
    this.loading = true;
    this.api.ticketsListBy({ niveau: 2, parentID }).subscribe({
      next: data => { this.userStories = data; this.filteredUserStories = data; this.loading = false; },
      error: err => { console.error(err); this.loading = false; }
    });
  }

  loadTaches(parentID?: string): void {
    if (!parentID) return;
    this.loading = true;
    this.api.ticketsListBy({ niveau: 3, parentID }).subscribe({
      next: data => { this.taches = data; this.filteredTaches = data; this.loading = false; },
      error: err => { console.error(err); this.loading = false; }
    });
  }

  //---------------------------------------------------------------------------
  applyModuleFilter(status: number) {
    this.filteredModules = this.modules.filter(
      m => this.modulesStatusFilter == 0 || m.status === status
    );
    if (this.selectedModule && !this.filteredModules.includes(this.selectedModule)) {
      this.selectedModule = undefined;
    }
  }

  applyUSFilter(status: number) {
    this.filteredUserStories = this.userStories.filter(
      us => this.usStatusFilter == 0 || us.status === status
    );
    if (this.selectedUS && !this.filteredUserStories.includes(this.selectedUS)) {
      this.selectedUS = undefined;
    }
  }

  applyTaskFilter(status: number) {
    this.filteredTaches = this.taches.filter(
      t => this.taskStatusFilter == 0 || t.status === status
    );
  }
  //---------------------------------------------------------------------------

  openEquipes(p: Projets) { }
  openSuivi(p: Projets) { }
  openTaches(p: Projets) { }
  openDetailProjet(p: Projets): void {
    this.showInterface = 2;
  }

  editProjet(p?: Projets) {
    if (p) { this.selectedProjet = p, this.newProject = { ...p } }
    else { this.newProject = this.selectedProjet = { ...new Projets(), organisationID: this.fparam.organisationID } }
    this.showInterface = 2;
  }

  closeProjectView(event?: any) { if (event) { this.loadProjets() } this.newProject = new Projets(); this.showInterface = 1; }
  //----------------------------------------

  confirmDeleteProject(item: Projets) { this.selectedProjet = { ...item }; this.deleteProjectDialog = true; }

  deleteProject() {
    this.deleteProjectDialog = false;
    this.loading = true;
    this.api.projetDelete(this.selectedProjet.projetID).subscribe({
      next: data => { this.loading = false; this.loadProjets(); },
      error: err => { console.error(err.error); this.loading = false; }
    });
  }
  //==================================================================================================

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

  //----------------------

  editTicket(n: number, ticket?: Ticket): void {
    if (ticket) {
      this.ticket = { ...ticket };
    }
    else {
      const pID =
        n === 2 ? this.selectedModule?.ticketID :
          n === 3 ? this.selectedUS?.ticketID :
            undefined;

      this.ticket = { ...new Ticket(), niveau: n, parentID: pID!, projetID: this.selectedProjet?.projetID }
    }
    this.dialogView = 'edition';
    this.displayDialog = true;
    this.loading = false;
  }

  closeDialog(t?: any) { if (t) { this.reloadAfterEdit(); } this.displayDialog = false; this.ticket = undefined }



  reloadAfterEdit() {
    switch (this.ticket?.niveau) {
      case 1:
        this.loadModules(this.selectedProjet.projetID);
        break;
      case 2:
        this.loadUserStories(this.selectedModule?.ticketID);
        break;
      case 3:
        this.loadTaches(this.selectedUS?.parentID);
        break;

      default:
        break;
    }
  }
  //-------------------------------------------------------------
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
        this.reloadAfterEdit();
        this.loading = false; this.deleteDialog = false; this.ticketToDeleteId = undefined;
      },
      error: (err) => { console.error(err); this.deleteDialog = false; },
    });
  }
  //---------------------------------------------------------------------------

  getTitreForm(niveau: number): string {
    switch (niveau) {
      case 1:
        return 'Nouveau_module';
      case 2:
        return 'Nouvelle_us';
      case 3:
        return 'Nouvelle_tache';
      default:
        return '';
    }
  }
  //---------------------------------------------------------------------------

  /** Soumission du formulaire */
  onSave(form: NgForm): void {
    if (form.invalid) { form.control.markAllAsTouched(); return; }
    this.loading = true;
    this.insertTicket();
  }

  insertTicket(): void {
    this.api
      .ticketsInsert({ ...this.ticket, user_update: this.fparam.login, ip_update: '127.0.0.1', })
      .subscribe({
        next: () => { this.closeDialog(); },
        error: (err) => { console.error(err); this.loading = false; },
      });
  }

  //---------------------------------------------------------------------------
  /** Calcul automatique de la durée à chaque changement de date */
  detDuree(): void {
    if (this.ticket) {
      if (this.ticket.dateDebut && this.ticket.dateFin) {
        const d1 = new Date(this.ticket.dateDebut);
        const d2 = new Date(this.ticket.dateFin);
        const diffMs = d2.getTime() - d1.getTime();
        const jours = Math.round(diffMs / (1000 * 60 * 60 * 24));
        this.ticket.duree = `${jours} jour${jours > 1 ? 's' : ''}`;
      } else {
        this.ticket.duree = '';
      }
    }
  }
  //---------------------------------------------------------------------------
  //---------------------------------------------------------------------------
  //---------------------------------------------------------------------------
  //---------------------------------------------------------------------------
}