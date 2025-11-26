import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { DialogModule } from 'primeng/dialog';

// Services & Models
import { FindParam } from '../../class/dto/find-param';
import { Organisation } from '../../class/organisation';
import { Ticket } from '../../class/ticket';
import { ApiService } from '../../services/api.service';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { Priorite } from '../../class/priorite';
import { Projets } from '../../class/projets';
import { ModalService } from '../../layout/modalService';

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
    TicketEditComponent,
    TicketMembreListComponent
  ]
})
export class ItemsComponent implements OnInit {

  // Injections
  public translate = inject(TranslateService);
  private ts = inject(SessionStorageService);
  private api = inject(ApiService);
  private modalService = inject(ModalService);

  // Données
  organisations: Organisation[] = [];
  projets: any[] = []; // Peut contenir { projetID, count, ... }
  
  // Listes Tickets
  modules: Ticket[] = [];
  fonctionnalites: Ticket[] = []; // Niveau 2
  taches: Ticket[] = [];        // Niveau 3 (Global)
  tachesUS: Ticket[] = [];      // Niveau 3 (Par US)
  
  priorites: Priorite[] = [];

  // Sélection
  ticket: Ticket = new Ticket();
  ticketParent: Ticket = new Ticket();
  projetSelectionne?: Projets;

  // États UI
  ticketToDeleteId: string | null = null;
  deleteDialog = false;
  loading = false;
  showInterface = 1; // 1: List, 2: Detail US, 3: Edit, 4: Affectation

  fparam: FindParam;

  constructor() {
    this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser().login);
  }

  ngOnInit(): void { 
    this.listOrganisation(); 
    this.loadAll(); 
    this.listPriorite(); 
  }

  loadAll(): void { 
    this.listProjet(); 
    // On ne charge pas tout d'un coup pour optimiser, on charge au clic projet généralement
    // Mais on peut charger les modules si besoin
    this.listTicket(1); 
  }

  listOrganisation() { 
    this.api.organisationList().subscribe(data => this.organisations = data); 
  }

  listPriorite() { 
    this.api.prioriteList().subscribe(data => this.priorites = data); 
  }

  listProjet(): void {
    this.api.projetList({ organisationID: this.fparam.organisationID }).subscribe({
      next: (data) => { 
        this.projets = data; 
        // Sélectionner le premier par défaut si aucun sélectionné
        if(!this.projetSelectionne && this.projets.length > 0) {
            this.selectProject(this.projets[0]);
        }
      },
      error: (err) => console.error(err),
    });
  }

  listTicket(niveau: number): void {
    // Méthode générique, mais ici on préfère charger par contexte (Projet ou Parent)
    this.loading = true;
    this.api.ticketsListBy({ niveau }).subscribe({
      next: (data) => {
        if (niveau === 1) this.modules = data;
        else if (niveau === 2) this.fonctionnalites = data;
        this.loading = false;
      },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  selectProject(p: Projets) {
    this.projetSelectionne = p;
    this.loading = true;
    // Charge les tickets niveau 2 (Fonctionnalités/US) pour ce projet
    this.api.ticketsListBy({ niveau: 2, projetID: p.projetID }).subscribe({
      next: (data) => { this.fonctionnalites = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  // Affiche les tâches d'une US (Niveau 3)
  tacheListByUS(f: Ticket) {
    this.ticketParent = f;
    this.showInterface = 2; // Bascule vers vue détail
    this.loading = true;
    this.api.ticketsListBy({ niveau: 3, parentID: f.ticketID }).subscribe({
      next: (data) => { this.tachesUS = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  // Edition (Création ou Modif)
  // CORRECTION ICI: Acceptation de 'number | undefined' pour le paramètre n
  editTicket(n: number | undefined, ticket?: Ticket): void {
    if (ticket) { 
        this.ticket = { ...ticket }; 
    } else {
        // Création : on attache au parent correct selon le contexte
        let parentID = this.ticketParent?.ticketID; // Par défaut parent courant (US)
        
        // Si on crée une US (niv 2), le parent doit être un module (niv 1) ou null si pas géré ici
        // Ici on simplifie en prenant le projet courant
        
        this.ticket = { 
            ...new Ticket(), 
            niveau: n, 
            parentID: (n === 3) ? parentID : undefined, 
            projetID: this.projetSelectionne?.projetID 
        };
    }
    this.showInterface = 3;
    this.loading = false;
  }

  closeForm(p?: any) { 
    if (p) { 
        this.modalService.showStatusModal('success', 'Succès', 'Enregistrement réussi');
        // Recharger les données selon la vue précédente
        if(this.ticket.niveau === 3 && this.ticketParent.ticketID) {
            this.tacheListByUS(this.ticketParent); // Recharge tâches
            this.showInterface = 2;
        } else {
            if(this.projetSelectionne) this.selectProject(this.projetSelectionne); // Recharge US
            this.showInterface = 1;
        }
    } else {
        // Annulation : retour vue précédente
        this.showInterface = (this.ticket.niveau === 3 && this.ticketParent.ticketID) ? 2 : 1;
    }
    this.ticket = new Ticket(); 
  }

  openAffectation(t: Ticket) { 
      this.ticket = {...t}; 
      this.showInterface = 4; 
  }

  closeAffectation() { 
      this.showInterface = 2; // Retour liste tâches
  }

  confirmDelete(ticketID: string): void { 
      this.ticketToDeleteId = ticketID; 
      this.deleteDialog = true; 
  }

  deleteTicket(): void {
    if (!this.ticketToDeleteId) return;
    this.loading = true;
    this.api.ticketsDelete(this.ticketToDeleteId).subscribe({
      next: () => { 
          this.modalService.showStatusModal('success', 'Suppression', 'Ticket supprimé');
          // Rafraichir
          if(this.showInterface === 2 && this.ticketParent) {
              this.tacheListByUS(this.ticketParent);
          } else if (this.projetSelectionne) {
              this.selectProject(this.projetSelectionne);
          }
      },
      error: (err) => { 
          console.error(err); 
          this.modalService.showStatusModal('error', 'Erreur', 'Impossible de supprimer.');
      },
      complete: () => {
        this.loading = false;
        this.deleteDialog = false;
        this.ticketToDeleteId = null;
      },
    });
  }

  retour(currentInterface: number) {
    // Logique retour simple
    if (currentInterface === 2) this.showInterface = 1; // De tâches vers projets
    else if (currentInterface === 4) this.showInterface = 2; // De affectation vers tâches
    else this.showInterface = 1;
  }
}