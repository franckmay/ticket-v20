import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG Modules
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';

// Services
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProjetEquipe } from '../../class/projet-equipe';
import { ProjetMembre } from '../../class/projet-membre';
import { Projets } from '../../class/projets';
import { ApiService } from '../../services/api.service';
import { SessionStorageService } from '../../services/session/session-storage.service';

@Component({
  selector: 'app-projet-equipe-edit',
  templateUrl: './projet-equipe-edit.component.html',
  styleUrls: ['./projet-equipe-edit.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    // PrimeNG
    ToastModule,
    ConfirmDialogModule,
    ButtonModule,
    TooltipModule,
    DialogModule,
    InputTextModule,
    RippleModule
  ],
  providers: [MessageService, ConfirmationService] // Ces services doivent être fournis ici
})
export class ProjetEquipeEditComponent implements OnInit {
  @Input() projet!: Projets;
  @Output() cancel = new EventEmitter<void>();

  // --- État pour la gestion des équipes ---
  projetEquipes: ProjetEquipe[] = [];
  selectedEquipe: ProjetEquipe | null = null;
  equipeToEdit: ProjetEquipe = new ProjetEquipe();
  loadingTeams = false;
  dialogEquipeAdd = false;

  // --- État pour la gestion des membres ---
  allMembers: ProjetMembre[] = [];
  filteredMembers: ProjetMembre[] = [];
  selectedMembres = new Map<string, ProjetMembre>();
  loadingMembers = false;
  searchTerm = '';
  roles: any[] = [];

  private currentUserLogin: string;

  constructor(
    private api: ApiService,
    private session: SessionStorageService,
    public translate: TranslateService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.currentUserLogin = this.session.getUser().login;
  }

  ngOnInit(): void {
    this.loadProjectTeams();
    this.loadMemberRoles();
  }

  // ====== GESTION DES ÉQUIPES ======

  loadProjectTeams(): void {
    this.loadingTeams = true;
    this.selectedEquipe = null; // Réinitialiser la sélection
    this.api.projetEquipeList({ projetID: this.projet.projetID, organisationID: this.session.getOrganisation() })
      .subscribe({
        next: (data) => {
          this.projetEquipes = data;
          this.loadingTeams = false;
        },
        error: (err) => {
          this.loadingTeams = false;
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les équipes.' });
          console.error(err);
        }
      });
  }

  selectEquipe(equipe: ProjetEquipe): void {
    if (this.selectedEquipe?.projetequipeID === equipe.projetequipeID) {
      return;
    }
    this.selectedEquipe = equipe;
    this.loadMembersForTeam();
  }

  openTeamDialog(equipe?: ProjetEquipe): void {
    if (equipe) {
      this.equipeToEdit = { ...equipe };
    } else {
      const id = `EQ${new Date().toISOString().replace(/[-:T.]/g, '')}`;
      this.equipeToEdit = {
        ...new ProjetEquipe(),
        projetequipeID: id,
        projetID: this.projet.projetID,
        organisationID: this.session.getOrganisation(),
        user_update: this.currentUserLogin
      };
    }
    this.dialogEquipeAdd = true;
  }

  saveTeam(): void {
    this.api.projetEquipeInsert({ ...this.equipeToEdit }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Équipe enregistrée.' });
        this.dialogEquipeAdd = false;
        this.loadProjectTeams();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error.error || 'Une erreur est survenue.' });
      }
    });
  }

  confirmDeleteTeam(event: Event, equipe: ProjetEquipe): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Êtes-vous sûr de vouloir supprimer cette équipe ? Cette action est irréversible.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Non',
      accept: () => {
        this.api.projetEquipeDelete(equipe.projetequipeID).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Équipe supprimée.' });
            this.loadProjectTeams();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error.error || 'Impossible de supprimer.' })
        });
      }
    });
  }


  // ====== GESTION DES MEMBRES ======

  loadMemberRoles(): void {
    this.api.membreRoleList().subscribe(data => this.roles = data);
  }

  loadMembersForTeam(): void {
    if (!this.selectedEquipe) return;
    this.loadingMembers = true;
    this.searchTerm = '';
    this.api.membreListByEquipe({
      organisationID: this.session.getOrganisation(),
      projetequipeID: this.selectedEquipe.projetequipeID
    }).subscribe({
      next: data => {
        this.allMembers = data.map((m: ProjetMembre) => ({ ...m, description: m.description || '' }));
        this.selectedMembres.clear();
        this.allMembers.filter(m => m.membreID != null).forEach(m => this.selectedMembres.set(m.login, m));
        this.filterMembers();
        this.loadingMembers = false;
      },
      error: err => {
        this.loadingMembers = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: "Impossible de charger les membres de l'équipe." });
      }
    });
  }

  filterMembers(): void {
    if (!this.searchTerm) {
      this.filteredMembers = [...this.allMembers];
    } else {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      this.filteredMembers = this.allMembers.filter(m =>
        m.nom.toLowerCase().includes(lowerCaseSearch) ||
        m.prenom.toLowerCase().includes(lowerCaseSearch)
      );
    }
  }
  
  toggleSelection(membre: ProjetMembre): void {
    if (this.selectedMembres.has(membre.login)) {
      this.selectedMembres.delete(membre.login);
    } else {
      if (!membre.roleID) {
        membre.roleID = this.roles[0]?.roleID; 
      }
      this.selectedMembres.set(membre.login, membre);
    }
  }

  isSelected(membre: ProjetMembre): boolean {
    return this.selectedMembres.has(membre.login);
  }

  get selectedMembresList(): ProjetMembre[] {
    return Array.from(this.selectedMembres.values());
  }

  saveMemberAssignments(): void {
    const payload = this.selectedMembresList.map(membre => ({
      projetequipeID: this.selectedEquipe!.projetequipeID,
      login: membre.login,
      roleID: membre.roleID,
      description: membre.description,
      user_update: this.currentUserLogin,
      email: membre.email,
      nom: membre.nom,
      prenom: membre.prenom,
    }));

    this.loadingMembers = true;
    this.api.membreAffecterlist(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Les affectations ont été mises à jour.' });
        this.loadMembersForTeam();
      },
      error: err => {
        this.loadingMembers = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error.error || 'Erreur lors de l\'affectation.' });
      }
    });
  }

  getInitials(membre: ProjetMembre): string {
    const prenom = membre.prenom || '';
    const nom = membre.nom || '';
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }

  backToList(): void {
    this.cancel.emit();
  }
}