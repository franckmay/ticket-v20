import { Component, EventEmitter, Input, Output, SimpleChanges, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Services & Models
import { FindParam } from '../../class/dto/find-param';
import { Priorite } from '../../class/priorite';
import { Projets } from '../../class/projets';
import { Ticket } from '../../class/ticket';
import { ApiService } from '../../services/api.service';
import { SessionStorageService } from '../../services/session/session-storage.service';

@Component({
  selector: 'app-ticket-edit',
  templateUrl: './ticket-edit.component.html',
  styleUrls: ['./ticket-edit.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule
  ]
})
export class TicketEditComponent implements OnInit, OnChanges {

  @Input() ticket: Ticket | null = null;
  @Input() projets: Projets[] | null = null;
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  priorites: Priorite[] = [];
  types: any[] = [];

  modules: Ticket[] = [];
  modulesForm: Ticket[] = [];
  fonctionnalites: Ticket[] = [];

  loading = false;
  loadingTickets = false;
  invalidForm = false;
  errorMessage = ''
  fparam: FindParam;

  constructor(public translate: TranslateService, private ts: SessionStorageService, private api: ApiService) {
    this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser().login);
  }


  ngOnInit() {
    console.log(this.ticket);

    this.listPriorite();
    this.listTypeTicket();

    if (this.ticket!.niveau == 1 && !this.projets!.length) { this.loadProjets(); }

    if (this.ticket!.niveau == 2) { this.listTicket(1); }
    else if (this.ticket!.niveau == 3) { this.listTicket(2); }
  }

  ngOnChanges(changes: SimpleChanges) {
    // if (changes['ticket'] && this.ticket) { this.isUpdateMode = true; }
    // else { this.resetForm(); }
  }


  loadProjets(): void {
    this.loading = true;
    this.api.projetList({ ...this.fparam }).subscribe({
      next: data => { this.projets = data; this.loading = false; },
      error: err => { console.error(err); this.loading = false; }
    });
  }
  //--------------------------------------------------------------------------------

  listPriorite(): void { this.api.prioriteList().subscribe({ next: (data) => { this.priorites = data; }, error: (err) => console.error(err), }); }
  // ---------- -------------------- -------------------- ----------

  listTypeTicket(): void { this.api.typeTicketList().subscribe({ next: (data) => { this.types = data; }, error: (err) => console.error(err) }); }
  // ---------- -------------------- -------------------- ----------
  listTicket(niveau: number): void {
    console.log("chack");
    this.loadingTickets = true;
    this.api.ticketsListBy({ niveau, projetID: this.ticket!.projetID }).subscribe({
      next: (data) => {
        if (niveau === 1) { this.modules = data; this.modulesForm = data; }
        else if (niveau === 2) this.fonctionnalites = data;
        this.loadingTickets = false;
      },
      error: (err) => console.error(err)
    });
  }
  // ---------- -------------------- -------------------- ----------
  onProjetChange() {
    if (this.ticket!.niveau == 2) { this.listTicket(1); }
    else if (this.ticket!.niveau == 3) { this.listTicket(2); }
  }

  // ---------- -------------------- -------------------- ----------
  // ---------- -------------------- -------------------- ----------

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

  // ---------- -------------------- -------------------- ----------

  /** Soumission du formulaire (ngSubmit) */
  onSave(form: NgForm): void {
    if (form.invalid) { form.control.markAllAsTouched(); return; }
    this.loading = true;
    this.insertTicket();
  }

  insertTicket(): void {
    this.api
      .ticketsInsert({ ...this.ticket, user_update: this.fparam.login, ip_update: '127.0.0.1', })
      .subscribe({
        next: () => { this.afterSave(); },
        error: (err) => { console.error(err); this.invalidForm = true; this.errorMessage = err.error; this.loading = false; },
      });
  }

  // ---------- -------------------- -------------------- ----------

  detDureei(): void {
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
  detDuree(): void {
    if (!this.ticket) return;

    const { dateDebut, dateFin } = this.ticket;
    if (!dateDebut || !dateFin) { this.ticket.duree = ''; return; }

    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    let diffMs = d2.getTime() - d1.getTime();
    if (diffMs < 0) { this.ticket.duree = 'Dates invalides'; return; }

    // Constantes
    const MS_PER_MINUTE = 1000 * 60;
    const MS_PER_HOUR = MS_PER_MINUTE * 60;
    const MS_PER_DAY = MS_PER_HOUR * 24;
    const MS_PER_MONTH = MS_PER_DAY * 30; // approximation

    // Calcul des unités
    const months = Math.floor(diffMs / MS_PER_MONTH);
    diffMs %= MS_PER_MONTH;

    const days = Math.floor(diffMs / MS_PER_DAY);
    diffMs %= MS_PER_DAY;

    const hours = Math.floor(diffMs / MS_PER_HOUR);
    diffMs %= MS_PER_HOUR;

    const minutes = Math.floor(diffMs / MS_PER_MINUTE);

    // Construction de la chaîne, on ajoute seulement les parties non nulles
    const parts: string[] = [];
    if (months > 0) parts.push(`${months} mois`);
    if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

    // Si tout est à 0 (cas dateDebut === dateFin), on affiche « 0 minute »
    this.ticket.duree = parts.length > 0 ? parts.join(' ') : '0 minute';
  }

  resetForm() { this.ticket = new Ticket(); }
  //--------------------------------------------------------------------------------
  afterSave() { this.save.emit({ ...this.ticket }); } 

  onCancel() { this.cancel.emit(); this.resetForm(); }
  //--------------------------------------------------------------------------------
}