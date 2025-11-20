import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG (Supposés nécessaires pour vos Dialogues et Tableaux)
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Services & Models
import { FindParam } from '../../class/dto/find-param';
import { Organisation } from '../../class/organisation';
import { Ticket } from '../../class/ticket';
import { ApiService } from '../../services/api.service';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { NotificationService } from '../../services/notifications/notification.service';
import { Ticketmembre } from '../../class/ticketmembre';
import { Priorite } from '../../class/priorite';
import { ProjetMembre } from '../../class/projet-membre';
import { Projets } from '../../class/projets';

// Composants Enfants
import { TicketEditComponent } from '../../fragments/ticket-edit/ticket-edit.component';
import { TicketMembreListComponent } from '../../fragments/ticket-membre-list/ticket-membre-list.component';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    DialogModule,
    ButtonModule,
    TableModule,
    ConfirmDialogModule,
    TicketEditComponent,
    TicketMembreListComponent
  ]
})
export class ItemsComponent implements OnInit {

  organisation: Organisation = new Organisation();
  organisations: Organisation[] = [];

  projets: any[] = [];
  niveaux: string[] = ['1', '2', '3'];

  modules: Ticket[] = [];
  fonctionnalites: Ticket[] = [];
  taches: Ticket[] = [];
  priorites: Priorite[] = [];

  tachesUS: Ticket[] = [];

  ticket: Ticket = new Ticket();
  ticketParent: Ticket = new Ticket();

  // suppression
  ticketToDeleteId: string | null = null;

  deleteDialog = false;
  loading = false;

  showInterface = 1;
  niveau = 2;

  fparam: FindParam;
  action = 'nouvelle';

  filterText!: string;
  selectedProjectId!: string;

  projetSelectionne?: Projets;

  constructor(public translate: TranslateService, private ts: SessionStorageService, private api: ApiService) {
    this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser().login);
  }

  ngOnInit(): void { this.listOrganisation(); this.loadAll(); this.listPriorite(); }

  // ---------- -------------------- -------------------- ----------
  loadAll(): void { this.listProjet(); this.listTicket(1); this.listTicket(2); this.listTicket(3); }
  // ---------- -------------------- -------------------- ----------

  listOrganisation() { this.api.organisationList().subscribe((data) => { this.organisations = data; }); }
  // ---------- -------------------- -------------------- ----------

  listPriorite(): void { this.api.prioriteList().subscribe({ next: (data) => { this.priorites = data; }, error: (err) => console.error(err) }); }
  // ---------- -------------------- -------------------- ----------

  listProjet(): void {
    this.api.projetList({ organisationID: this.fparam.organisationID }).subscribe({
      next: (data) => { this.projets = data; },
      error: (err) => console.error(err),
    });
  }
  // ---------- -------------------- -------------------- ----------

  listTicket(niveau: number): void {
    this.loading = true;
    this.api.ticketsListBy({ niveau }).subscribe({
      next: (data) => {
        if (niveau === 1) { this.modules = data; }
        else if (niveau === 2) this.fonctionnalites = data;
        else if (niveau === 3) this.taches = data;
        this.loading = false;
      },
      error: (err) => { console.error(err); this.loading = false },
      complete: () => (this.loading = false),
    });
  }
  // ---------- -------------------- -------------------- ----------

  tacheListByUS(f: Ticket) {
    this.ticketParent = f;
    this.showInterface = 2;
    this.loading = true;
    console.log('le parentID', f.parentID);
    this.api.ticketsListBy({ niveau: 3, parentID: f.ticketID }).subscribe({
      next: (data) => { this.tachesUS = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false }
    });
  }

  // ---------- -------------------- -------------------- ----------

  editTicket(n: number, ticket?: Ticket): void {
    if (ticket) { this.ticket = { ...ticket }; this.showInterface = 3; }
    else {
      this.ticket = { ...new Ticket(), niveau: n, parentID: this.ticketParent?.ticketID, };
      this.showInterface = 3;
    }
    this.loading = false;
  }

  closeForm(p?: any) { if (p) { this.loadAll(); } this.showInterface = 1; this.ticket = new Ticket(); }
  // ---------- -------------------- -------------------- ----------
  selectProject(p: Projets) {
    this.projetSelectionne = p;
    this.loading = true;
    this.api.ticketsListBy({ niveau: 2, projetID: p.projetID }).subscribe({
      next: (data) => { this.fonctionnalites = data; this.loading = false; },
      error: (err) => console.error(err),
      complete: () => (this.loading = false),
    });
  }
  // ---------- -------------------- -------------------- ----------

  // ---------- -------------------- -------------------- ----------

  openAffectation(t: Ticket) { console.log(t); this.ticket = {...t}; this.showInterface = 4; }

  closeAffectation() { this.showInterface = 2; }
  // ---------- -------------------- -------------------- ----------
  confirmDelete(ticketID: string): void { this.ticketToDeleteId = ticketID; this.deleteDialog = true; }

  deleteTicket(): void {
    if (!this.ticketToDeleteId) return;
    this.loading = true;
    this.api.ticketsDelete(this.ticketToDeleteId).subscribe({
      next: () => { this.loadAll(); },
      error: (err) => { console.error(err); },
      complete: () => {
        this.loading = false;
        this.deleteDialog = false;
        this.ticketToDeleteId = null;
      },
    });
  }
  // ---------- -------------------- -------------------- ----------
  retour(index: number) {
    switch (index) {
      case 2:
        this.showInterface = 1;
        break;
      case 4:
        this.showInterface = 2;
        break;

      default:
        this.showInterface = 1;
        break;
    }
  }

  /** Calcul automatique de la durée à chaque changement de date */
  computeDuree(): void {
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