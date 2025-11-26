import { Component, EventEmitter, Input, Output, SimpleChanges, OnInit, OnChanges, inject } from '@angular/core';
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
import { ModalService } from '../../layout/modalService';

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
  @Input() projets: Projets[] | null = []; 
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  priorites: Priorite[] = [];
  types: any[] = [];

  modules: Ticket[] = [];
  modulesForm: Ticket[] = [];
  fonctionnalites: Ticket[] = [];

  loading = false;
  loadingTickets = false;
  fparam: FindParam;

  // Injection du ModalService
  private modalService = inject(ModalService);

  constructor(
    public translate: TranslateService, 
    private ts: SessionStorageService, 
    private api: ApiService
  ) {
    this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser().login);
  }

  ngOnInit() {
    this.listPriorite();
    this.listTypeTicket();

    if (this.ticket) {
      if (this.ticket.niveau == 1 && (!this.projets || !this.projets.length)) { 
        this.loadProjets(); 
      }
      // Chargement des parents si nécessaire
      if (this.ticket.niveau == 2) { this.listTicket(1); }
      else if (this.ticket.niveau == 3) { this.listTicket(2); }
      
      // Recalcul durée initial
      this.detDuree();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Si le ticket change, on peut vouloir recharger certaines listes
    if (changes['ticket'] && !changes['ticket'].firstChange) {
        if (this.ticket && this.ticket.niveau == 2) { this.listTicket(1); }
        else if (this.ticket && this.ticket.niveau == 3) { this.listTicket(2); }
    }
  }

  loadProjets(): void {
    this.api.projetList({ ...this.fparam }).subscribe({
      next: data => { this.projets = data; },
      error: err => console.error(err)
    });
  }

  listPriorite(): void { 
    this.api.prioriteList().subscribe({ 
      next: (data) => { this.priorites = data; }, 
      error: (err) => console.error(err), 
    }); 
  }

  listTypeTicket(): void { 
    this.api.typeTicketList().subscribe({ 
      next: (data) => { this.types = data; }, 
      error: (err) => console.error(err) 
    }); 
  }

  listTicket(niveau: number): void {
    if (!this.ticket?.projetID) return;
    
    this.loadingTickets = true;
    this.api.ticketsListBy({ niveau, projetID: this.ticket.projetID }).subscribe({
      next: (data) => {
        if (niveau === 1) { this.modules = data; this.modulesForm = data; }
        else if (niveau === 2) this.fonctionnalites = data;
        this.loadingTickets = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingTickets = false;
      }
    });
  }

  onProjetChange() {
    if (!this.ticket) return;
    this.ticket.parentID = undefined; // Reset parent si projet change
    if (this.ticket.niveau == 2) { this.listTicket(1); }
    else if (this.ticket.niveau == 3) { this.listTicket(2); }
  }

  getTitreForm(niveau?: number): string {
    switch (niveau) {
      case 1: return 'Nouveau_module';
      case 2: return 'Nouvelle_us';
      case 3: return 'Nouvelle_tache';
      default: return 'Edition Ticket';
    }
  }

  onSave(form: NgForm): void {
    if (form.invalid) { 
      // Utilisation du ModalService pour l'alerte
      this.modalService.showStatusModal('error', 'Formulaire incomplet', 'Veuillez remplir tous les champs obligatoires.');
      form.control.markAllAsTouched(); 
      return; 
    }
    this.loading = true;
    this.insertTicket();
  }

  insertTicket(): void {
    if (!this.ticket) return;

    this.api
      .ticketsInsert({ ...this.ticket, user_update: this.fparam.login, ip_update: '127.0.0.1', })
      .subscribe({
        next: () => { 
          this.loading = false;
          // Notification succès via ModalService
          this.modalService.showStatusModal('success', 'Succès', 'Ticket enregistré avec succès');
          this.afterSave(); 
        },
        error: (err) => { 
          console.error(err); 
          this.loading = false;
          const msg = err.error?.message || 'Une erreur est survenue lors de la sauvegarde.';
          this.modalService.showStatusModal('error', 'Erreur', msg);
        },
      });
  }

  detDuree(): void {
    if (!this.ticket || !this.ticket.dateDebut || !this.ticket.dateFin) { 
        if(this.ticket) this.ticket.duree = ''; 
        return; 
    }

    const d1 = new Date(this.ticket.dateDebut);
    const d2 = new Date(this.ticket.dateFin);
    let diffMs = d2.getTime() - d1.getTime();

    if (diffMs < 0) { this.ticket.duree = 'Dates invalides'; return; }

    const MS_PER_MINUTE = 1000 * 60;
    const MS_PER_HOUR = MS_PER_MINUTE * 60;
    const MS_PER_DAY = MS_PER_HOUR * 24;

    const days = Math.floor(diffMs / MS_PER_DAY);
    diffMs %= MS_PER_DAY;
    const hours = Math.floor(diffMs / MS_PER_HOUR);
    diffMs %= MS_PER_HOUR;
    const minutes = Math.floor(diffMs / MS_PER_MINUTE);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}j`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    this.ticket.duree = parts.length > 0 ? parts.join(' ') : '0m';
  }

  resetForm() { this.ticket = new Ticket(); }
  afterSave() { this.save.emit({ ...this.ticket }); } 
  onCancel() { this.cancel.emit(); this.resetForm(); }
}