import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner'; // Pour displaySpinner

import { FindParam } from '../../class/dto/find-param';
import { Projets } from '../../class/projets';
import { Sprint } from '../../class/sprint';
import { SprintTicket } from '../../class/sprint-ticket';
import { Ticket } from '../../class/ticket';
import { Action } from '../../enum/action.enum';
import { ApiService } from '../../services/api.service';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { Menu } from "primeng/menu";
import { TableModule } from "primeng/table";
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-sprint',
  templateUrl: './sprint.component.html',
  styleUrls: ['./sprint.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    DialogModule,
    ButtonModule,
    ProgressSpinnerModule,
    Menu,
    TableModule,
    TooltipModule
]
})
export class SprintComponent implements OnInit, OnChanges {
  @Input() projet!: Projets;
  @Output() cancel = new EventEmitter<void>();
  @ViewChild('form') form!: NgForm;


  projets: Projets[] = [];
  sprint: Sprint = new Sprint();
  sprints: Sprint[] = [];
  sprintTickets: SprintTicket[] = [];
  selectedSP: SprintTicket[] = [];
  tasks: Ticket[] = [];
  sprintTicket: SprintTicket = new SprintTicket();


  pageByAction = Action.LIST
  displaySpinner: boolean = false;
  deleteSprintDialog: boolean = false;
  currentAction = 'edit';
  acte = 1;
  options: any[] = [];
  fparam: any;
  user: any;
  mode: 'list' | 'create' | 'edit' = 'list';

  newSprint!: Sprint;
  existingTickets: (SprintTicket & { libelleFr: string })[] = [];
  ticketsLevel3: { ticketID: string; libelleFr: string }[] = [];



  lastSavedSelections: Record<string, SprintTicket[]> = {};

  etatOptions = [
    { value: '10', label: 'enattente' },
    { value: '20', label: 'encours' },
    { value: '30', label: 'Réouvert' },
    { value: '40', label: 'Résolu' },
    { value: '50', label: 'Fermé' }
  ];

  constructor(private api: ApiService, private ts: SessionStorageService, public translate: TranslateService,) { this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser().login); }

  ngOnInit() { this.listProjet(); this.listSprint() }

  ngOnChanges(changes: SimpleChanges) { if (changes['projet'] && this.projet) { this.listProjet(); this.listSprint() } }

  onCancel() { this.cancel.emit(); }
  //------------------------------------------------------------------------------------------------------------------------------------
  listProjet() {
    this.displaySpinner = true;
    this.api.projetList({ ...this.fparam }).subscribe({
      next: data => {
        this.projets = data;
        this.displaySpinner = false;
      }, error: err => { console.error(err); this.displaySpinner = false; }
    });
  }
  //------------------------------------------------------------------------------------------------------------------------------------
  listSprint() {
    this.displaySpinner = true;
    this.api.getSprints({ ...this.fparam, projetID: this.projet.projetID }).subscribe({
      next: data => {
        this.sprints = data;
        this.displaySpinner = false;
      }, error: err => { console.error(err); this.displaySpinner = false; }
    });
  }

  isDisabled: boolean = true;
  listSprintTicket(sprintID: string) {
    this.displaySpinner = true;

    this.api.getSprintTickets(sprintID)
      .pipe(
        finalize(() => this.displaySpinner = false)
      )
      .subscribe({
        next: allTickets => {
          this.selectedSP = allTickets.filter((t: SprintTicket) => t.sprintID === this.sprint.sprintID);
          this.ticketsLevel3 = allTickets;
          setTimeout(() => { this.isDisabled = false; });
        },
        error: err => { console.error('Error loading sprint tickets:', err); }
      });
  }
  //------------------------------------------------------------------------------------------------------------------------------------

  reload() {
    this.listSprint()
  }
  //------------------------------------------------------------------------------------------------------------------------------------

  backToList() {
    this.mode = 'list';
    this.sprint = new Sprint();
    this.selectedSP = [];
    this.existingTickets = [];
  }

  listTicket(projetID: string) {
    this.displaySpinner = true;
    this.api.ticketsListBy({ niveau: 3, projetID }).subscribe({
      next: (tickets: Ticket[]) => {
        this.ticketsLevel3 = tickets.map(t => ({
          ...t,
          estimation: this.existingTickets.find(st => st.ticketID === t.ticketID)?.estimation || 0
        }));
      },
      error: (err) => console.error(err),
      complete: () => this.displaySpinner = false
    });
  }

  showCreate() {
    this.mode = 'create';
    this.sprint = new Sprint();
    this.sprint.sprintID = this.generateId('SPR');
    this.selectedSP = [];
    this.existingTickets = [];
    this.ticketsLevel3 = [];
  }

  save() {
    if (!this.validateForm()) {
      return;
    }
    this.displaySpinner = true;
    const payload: Sprint = {
      ...this.sprint,
      user_update: this.fparam.login,
      organisationID: this.ts.getUser().organisationID,
      sprintTickets: this.prepareTicketPayload()
    };

    console.log('Saving sprint payload:', payload);

    const call$ =
      this.mode === 'edit'
        ? this.api.insertSprint(payload)
        : this.api.insertSprint(payload);

    call$.subscribe(
      () => {
        this.displaySpinner = false;
        // cache these selections
        this.lastSavedSelections[this.sprint.sprintID] = [...this.selectedSP];
        this.showSuccesDialog('Sprint sauvegardé avec succès !');
        this.closeEditDialog();
      },
      (error) => {
        this.displaySpinner = false;
        console.error('Error during saving:', error);
        this.showErrorDialog(error.error || 'Erreur inconnue');
      }
    );
  }

  closeEditDialog() { this.mode = 'list'; this.sprints = [...this.sprints] }
  prepareTicketPayload(): SprintTicket[] {
    return this.selectedSP.map(t => ({
      sprintTicketID: t.sprintTicketID || this.generateId('SPRTKT'),
      ticketID: t.ticketID,
      estimation: t.estimation || 0,
      sprintID: this.sprint.sprintID,
      user_update: this.fparam.login
    }));
  }

  showEdit(sprint: Sprint) {
    this.mode = 'edit';
    this.displaySpinner = true;
    this.sprint = sprint;
    this.listSprintTicket(sprint.sprintID);
  }

  validateForm() {
    const requiredFields = [
      this.sprint.projetID,
      this.sprint.organisationID,
      this.sprint.nom,
      this.sprint.dateDebut,
      this.sprint.dateFin
    ];

    if (requiredFields.some(f => !f)) {
      this.showErrorDialog('Please fill all required fields');
      return false;
    }

    if (this.selectedSP.length === 0) {
      this.showErrorDialog('Please select at least one ticket');
      return false;
    }

    return true;
  }

  handleSaveSuccess() {
    this.displaySpinner = false;
    this.showSuccesDialog(`Sprint ${this.mode === 'create' ? 'created' : 'updated'} successfully`);
    this.backToList();
  }

  handleSaveError(error: any) {
    this.displaySpinner = false;
    console.error('Save error:', error);
    this.showErrorDialog(error.error?.message || 'Operation failed');
  }

  isTicketSelected(ticketID: string): boolean {
    return this.selectedSP.some(t => t.ticketID === ticketID);
  }

  validateEstimation(ticket: Ticket) {
    if (!ticket.estimation || ticket.estimation < 0) {
      ticket.estimation = 0;
    }
  }

  isFormValid(): boolean {
    return !!this.form?.valid &&
      this.selectedSP.length > 0 &&
      new Date(this.sprint.dateFin) >= new Date(this.sprint.dateDebut);
  }


  handleError(err: any): void {
    throw new Error('Method not implemented.');
  }

  cancelCreate() {
    this.mode = 'list';
  }
  resetForm() {
    this.sprint = new Sprint();
    this.selectedSP = [];
    this.existingTickets = [];
    this.mode = 'list';
  }

  confirmDelete(item: Sprint) { this.sprint = { ...item }; this.deleteSprintDialog = true; }

  deleteSprint() {
    this.displaySpinner = true;
    this.api.sprintDelete(this.sprint.sprintID).subscribe({
      next: data => {
        this.displaySpinner = false;
        this.listSprint();
        this.deleteSprintDialog = false;
        this.showSuccesDialog("succes suppression")
      },
      error: err => {
        console.error(err.error);
        this.displaySpinner = false;
        this.showErrorDialog("Echec de la Suppression");
      }
    });
  }

  resetFilters() {
    this.fparam = { organisationID: '', etat: undefined, dateDebut: null, dateFin: null };
    this.listSprint();
  }

  removeTicket(ticketToRemove: SprintTicket) {
    this.selectedSP = this.selectedSP.filter(t => t.ticketID !== ticketToRemove.ticketID);
    this.existingTickets = this.existingTickets.filter(t => t.ticketID !== ticketToRemove.ticketID);
    this.listTicket(this.sprint.projetID);
  }

  successMessage = ''; displaySucces = false; errorMessage = ''; displayError = false;
  showSuccesDialog(message: string) { this.successMessage = message; this.displaySucces = true; }
  closeSucces() { this.displaySucces = false; }

  showErrorDialog(message: string) { this.errorMessage = message; this.displayError = true; }
  closeError() { this.displayError = false; }

  generateId(prefix: string): string {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(2, 14);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }
  generateSprintTicketID(): string {
    return `SPRINTKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}