import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';

// PrimeNG Modules (Uniquement ceux nécessaires et compatibles sans CDK complexe)
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { SplitterModule } from 'primeng/splitter';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

// Services & Models
import { ProjetService } from '../../services/projet.service';
import { TicketService } from '../../services/ticket.service';
import { SprintService } from '../../services/sprint.service';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { Ticket } from '../../class/ticket';
import { Projets } from '../../class/projets';
import { FindParam } from '../../class/dto/find-param';

// Fragments
import { TicketDetailComponent } from '../../fragments/ticket-detail/ticket-detail.component';
import { ProjetEditComponent } from '../../fragments/projet-edit/projet-edit.component';
import { TicketEditComponent } from '../../fragments/ticket-edit/ticket-edit.component';
import { SprintComponent } from '../../components/sprint/sprint.component';
import { ProjetEquipeEditComponent } from '../../fragments/projet-equipe-edit/projet-equipe-edit.component';
import { TicketMembreListComponent } from '../../fragments/ticket-membre-list/ticket-membre-list.component';

type ViewMode = 'dashboard' | 'workspace';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    SkeletonModule,
    TooltipModule,
    AvatarModule,
    DialogModule,
    SplitterModule,
    ProgressBarModule,
    ConfirmDialogModule,
    ToastModule,
    // Fragments
    TicketDetailComponent,
    ProjetEditComponent,
    TicketEditComponent,
    SprintComponent,
    ProjetEquipeEditComponent,
    TicketMembreListComponent
  ],
  providers: [ConfirmationService, MessageService]
})
export class DashboardComponent implements OnInit {
  
  private projetService = inject(ProjetService);
  private ticketService = inject(TicketService);
  private sprintService = inject(SprintService);
  private sessionService = inject(SessionStorageService);
  private cdr = inject(ChangeDetectorRef);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // --- ETAT UI ---
  viewMode = signal<ViewMode>('dashboard');
  loading = signal<boolean>(false);
  loadingWorkspace = signal<boolean>(false);
  currentUser = signal<any>(null);
  fparam: any;

  // --- DONNEES ---
  projects = signal<Projets[]>([]); // Tous les projets
  
  // Sélection Courante (Workspace)
  selectedProjet?: Projets;
  selectedModule?: Ticket;
  selectedUS?: Ticket;
  
  // Listes Hiérarchiques
  modules = signal<Ticket[]>([]);     
  userStories = signal<Ticket[]>([]); 
  tasks = signal<Ticket[]>([]);       

  // --- MODALES ---
  displayProjetDialog = false;
  displayTicketDialog = false;
  displaySprintDialog = false;
  displayEquipeDialog = false;
  displayAffectationDialog = false;
  
  newProject = new Projets();
  selectedTicket?: Ticket;
  dialogTicketMode: 'detail' | 'edit' = 'detail';

  ngOnInit(): void {
    const user = this.sessionService.getUser();
    if (user) {
      this.currentUser.set(user);
      this.fparam = new FindParam(this.sessionService.getOrganisation(), user.login);
      this.loadProjects();
    }
  }

  // =========================================================
  // 1. CHARGEMENT
  // =========================================================

  loadProjects(): void {
    this.loading.set(true);
    this.projetService.list({ ...this.fparam, membre: this.currentUser().login })
      .pipe(finalize(() => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => this.projects.set(data || []),
        error: (err) => this.messageService.add({severity:'error', summary:'Erreur', detail:'Chargement échoué'})
      });
  }

  // =========================================================
  // 2. NAVIGATION (DASHBOARD <-> WORKSPACE)
  // =========================================================

  // Entrer dans un projet (Active la vue Workspace avec Sidebar)
  enterProject(p: Projets): void {
    this.selectedProjet = p;
    this.viewMode.set('workspace');
    this.resetWorkspace();
    this.loadModules(p.projetID);
  }

  // Changer de projet depuis la sidebar (reste dans Workspace)
  switchProject(p: Projets): void {
    if (this.selectedProjet?.projetID === p.projetID) return;
    this.enterProject(p);
  }

  // Retour Accueil
  backToDashboard(): void {
    this.selectedProjet = undefined;
    this.viewMode.set('dashboard');
    this.resetWorkspace();
  }

  resetWorkspace(): void {
    this.selectedModule = undefined;
    this.selectedUS = undefined;
    this.modules.set([]);
    this.userStories.set([]);
    this.tasks.set([]);
  }

  // =========================================================
  // 3. LOGIQUE CASCADE (SPLITTER)
  // =========================================================

  loadModules(projetID: string): void {
    this.loadingWorkspace.set(true);
    this.ticketService.list({ ...this.fparam, niveau: 1, projetID })
      .pipe(finalize(() => this.loadingWorkspace.set(false)))
      .subscribe(data => this.modules.set(data || []));
  }

  onSelectModule(m: Ticket): void {
    this.selectedModule = m;
    this.selectedUS = undefined;
    this.tasks.set([]); 
    
    this.loadingWorkspace.set(true);
    this.ticketService.list({ ...this.fparam, niveau: 2, parentID: m.ticketID })
      .pipe(finalize(() => this.loadingWorkspace.set(false)))
      .subscribe(data => this.userStories.set(data || []));
  }

  onSelectUS(us: Ticket): void {
    this.selectedUS = us;
    
    this.loadingWorkspace.set(true);
    this.ticketService.list({ ...this.fparam, niveau: 3, parentID: us.ticketID })
      .pipe(finalize(() => this.loadingWorkspace.set(false)))
      .subscribe(data => this.tasks.set(data || []));
  }

  // =========================================================
  // 4. ACTIONS CRUD (BOUTONS)
  // =========================================================

  openProjetEdit(p?: Projets, event?: Event): void {
    if (event) event.stopPropagation();
    if (p) {
      this.selectedProjet = p; 
      this.newProject = { ...p };
    } else {
      this.newProject = new Projets();
      this.newProject.organisationID = this.currentUser().organisationID;
    }
    this.displayProjetDialog = true;
  }

  closeProjetDialog(saved?: any): void {
    this.displayProjetDialog = false;
    if (saved) { 
      this.messageService.add({severity:'success', summary:'Succès', detail:'Enregistré'});
      this.loadProjects();
      if (this.selectedProjet && saved.projetID === this.selectedProjet.projetID) {
        this.selectedProjet = saved;
      }
    }
  }

  deleteProject(p: Projets, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `Supprimer "${p.libelleFr}" ?`,
      header: 'Confirmation',
      icon: 'fas fa-exclamation-triangle',
      accept: () => {
        this.projetService.delete(p.projetID).subscribe(() => {
          this.messageService.add({severity:'success', summary:'Supprimé', detail:'Projet supprimé'});
          this.loadProjects();
          if (this.selectedProjet?.projetID === p.projetID) this.backToDashboard();
        });
      }
    });
  }

  // --- TICKETS ---
  openTicketEdit(niveau: number, itemToEdit?: Ticket): void {
    if (itemToEdit) {
      this.selectedTicket = { ...itemToEdit };
    } else {
      const parentID = niveau === 2 ? this.selectedModule?.ticketID :
                       niveau === 3 ? this.selectedUS?.ticketID : undefined;
      
      let typeID = 'task'; 
      if (niveau === 1) typeID = 'module'; 
      else if (niveau === 2) typeID = 'us';

      this.selectedTicket = { 
        ...new Ticket(), 
        niveau, 
        parentID, 
        projetID: this.selectedProjet?.projetID,
        typeTicketID: typeID
      };
    }
    this.dialogTicketMode = 'edit';
    this.displayTicketDialog = true;
  }

  deleteTicket(t: Ticket, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: 'Supprimer cet élément ?',
      header: 'Confirmation',
      icon: 'fas fa-info-circle',
      accept: () => {
        this.ticketService.delete(t.ticketID).subscribe(() => {
          this.messageService.add({severity:'info', summary:'Supprimé', detail:'Élément supprimé'});
          if (t.niveau === 1 && this.selectedProjet) this.loadModules(this.selectedProjet.projetID);
          else if (t.niveau === 2 && this.selectedModule) this.onSelectModule(this.selectedModule);
          else if (t.niveau === 3 && this.selectedUS) this.onSelectUS(this.selectedUS);
        });
      }
    });
  }

  closeTicketDialog(saved?: boolean): void {
    this.displayTicketDialog = false;
    if (saved) {
      const niveau = this.selectedTicket?.niveau;
      if (niveau === 1 && this.selectedProjet) this.loadModules(this.selectedProjet.projetID);
      else if (niveau === 2 && this.selectedModule) this.onSelectModule(this.selectedModule);
      else if (niveau === 3 && this.selectedUS) this.onSelectUS(this.selectedUS);
    }
    this.selectedTicket = undefined;
  }

  openTicketDetail(t: Ticket): void {
    this.selectedTicket = t;
    this.dialogTicketMode = 'detail';
    this.displayTicketDialog = true;
  }

  // --- ACTIONS SECONDAIRES ---
  openSprints(p?: Projets, event?: Event): void { 
    if(event) event.stopPropagation();
    if(p) this.selectedProjet = p;
    this.displaySprintDialog = true; 
  }
  
  openEquipes(p?: Projets, event?: Event): void { 
    if(event) event.stopPropagation();
    if(p) this.selectedProjet = p;
    this.displayEquipeDialog = true; 
  }

  openAffectation(t: Ticket): void {
      this.selectedTicket = t;
      this.displayAffectationDialog = true;
  }

  // --- HELPERS ---
  getStatusClass(ticket: Ticket): string {
    const taux = ticket.tauxExecution || 0;
    if (taux === 100) return 'status-green';
    if (taux > 0) return 'status-blue';
    return 'status-gray';
  }
}