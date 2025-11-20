import { Component, EventEmitter, Input, Output, SimpleChanges, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { FindParam } from '../../class/dto/find-param';
import { Ticket } from '../../class/ticket';
import { Ticketmembre } from '../../class/ticketmembre';
import { ApiService } from '../../services/api.service';
import { SessionStorageService } from '../../services/session/session-storage.service';

@Component({
  selector: 'app-ticket-membre-list',
  templateUrl: './ticket-membre-list.component.html',
  styleUrls: ['./ticket-membre-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ToastModule
  ],
  providers: [MessageService] // Le service reste local au composant pour gérer ses propres Toasts
})
export class TicketMembreListComponent implements OnInit, OnChanges {
  @Input() ticket!: Ticket;
  @Output() cancel = new EventEmitter<void>();

  allMembers: Ticketmembre[] = []; // Tous les membres du projet
  filteredMembers: Ticketmembre[] = []; // Membres affichés (après filtre)
  selectedMembres: Ticketmembre[] = []; // Membres sélectionnés

  loading = false;
  fparam: FindParam;
  searchTerm: string = '';

  constructor(
    public translate: TranslateService,
    private ts: SessionStorageService,
    private api: ApiService,
    private messageService: MessageService // Injecté via le provider local
  ) {
    this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser().login);
  }

  ngOnInit(): void {
    // Pas besoin de lister ici, ngOnChanges s'en chargera au premier chargement du ticket
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['ticket'] && this.ticket) {
      this.listerAffectations();
    }
  }

  listerAffectations(): void {
    this.loading = true;
    this.api.ticketMembreList({ projetID: this.ticket!.projetID, ticketID: this.ticket!.ticketID }).subscribe({
      next: (data) => {
        this.allMembers = data.map((m:any) => ({ ...m, description: m.description || '' })); // Assurer que description n'est jamais null
        this.selectedMembres = this.allMembers.filter(m => m.assignmentID != null);
        this.filterMembers(); // Appliquer le filtre initial
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les membres.' });
      },
    });
  }

  // Gère la sélection/désélection d'un membre
  toggleSelection(membre: Ticketmembre): void {
    const index = this.selectedMembres.findIndex(m => m.login === membre.login);
    if (index > -1) {
      // Si déjà sélectionné, on le retire
      this.selectedMembres.splice(index, 1);
    } else {
      // Sinon, on l'ajoute
      this.selectedMembres.push(membre);
    }
  }

  // Renvoie true si un membre est dans la sélection
  isSelected(membre: Ticketmembre): boolean {
    return this.selectedMembres.some(m => m.login === membre.login);
  }

  // Filtre la liste des membres affichés en fonction du terme de recherche
  filterMembers(): void {
    if (!this.searchTerm) {
      this.filteredMembers = [...this.allMembers];
    } else {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      this.filteredMembers = this.allMembers.filter(m =>
        m.membreNom.toLowerCase().includes(lowerCaseSearch) ||
        m.membrePrenom.toLowerCase().includes(lowerCaseSearch) ||
        m.roleDesignation.toLowerCase().includes(lowerCaseSearch)
      );
    }
  }

  // Génère les initiales pour l'avatar
  getInitials(membre: Ticketmembre): string {
    const prenom = membre.membrePrenom || '';
    const nom = membre.membreNom || '';
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }

  saveAffectation(): void {
    // La logique existante est bonne, on remplace juste alert() par le toast
    const currentUser = this.ts.getUser().login;
    const payload = this.selectedMembres.map(membre => ({
      ticketID: this.ticket!.ticketID,
      login: membre.login,
      membreID: membre.membreID,
      roleID: membre.roleID,
      description: membre.description,
      user_update: currentUser
    }));
    
    if (payload.length === 0) {
      // Optionnel : si on veut permettre de désaffecter tout le monde.
       this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Aucun membre n\'est sélectionné. Toutes les affectations seront supprimées.' });
    }

    this.loading = true;
    this.api.ticketMembreInsertList(payload).subscribe({
      next: _ => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Les affectations ont été mises à jour.' });
        // On ne ferme pas automatiquement, l'utilisateur peut vouloir vérifier.
        // this.onCancel(); 
        this.listerAffectations(); // On rafraîchit pour voir le nouvel état
      },
      error: err => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error.error || 'Une erreur est survenue.' });
        console.error(err);
      }
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}