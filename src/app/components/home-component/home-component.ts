import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// PrimeNG Modules
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

// Services & Models
import { ProjetService } from '../../services/projet.service';
import { TicketService } from '../../services/ticket.service';
import { SprintService } from '../../services/sprint.service';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { Ticket } from '../../class/ticket';
import { Projets } from '../../class/projets';
import { FindParam } from '../../class/dto/find-param';

// Fragments (Composants Enfants) - Importés comme dans AccueilComponent
import { TicketDetailComponent } from '../../fragments/ticket-detail/ticket-detail.component';
import { ProjetEditComponent } from '../../fragments/projet-edit/projet-edit.component';
import { TicketEditComponent } from '../../fragments/ticket-edit/ticket-edit.component';
import { SprintComponent } from '../../components/sprint/sprint.component';
import { ProjetEquipeEditComponent } from '../../fragments/projet-equipe-edit/projet-equipe-edit.component';

@Component({
  selector: 'app-home',
  templateUrl: './home-component.html', // Correction chemin demandé
  styleUrls: ['./home-component.scss'], // Correction chemin demandé
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    SkeletonModule,
    TooltipModule,
    AvatarModule,
    DialogModule,
    ButtonModule,
    // Fragments Standalone
    TicketDetailComponent,
    ProjetEditComponent,
    TicketEditComponent,
    SprintComponent,
    ProjetEquipeEditComponent
  ]
})
export class HomeComponent implements OnInit {
  
  // Injections
  private projetService = inject(ProjetService);
  private ticketService = inject(TicketService);
  private sprintService = inject(SprintService);
  private sessionService = inject(SessionStorageService);
  private cdr = inject(ChangeDetectorRef);

  // --- ETAT (Signals) ---
  currentUser = signal<any>(null);
  loading = signal<boolean>(true);
  
  // Données
  projects = signal<Projets[]>([]);
  myModules = signal<Ticket[]>([]);     // Niveau 1
  myUserStories = signal<Ticket[]>([]); // Niveau 2
  myTasks = signal<Ticket[]>([]);       // Niveau 3
  activeSprint = signal<any>(null);
  
  // KPIs
  totalLoad = signal<number>(0);
  tasksDoneCount = signal<number>(0);

  // --- GESTION DES MODALES (Comme AccueilComponent) ---
  displayTicketDialog = false;    // Détail ticket
  displayProjetDialog = false;    // Edit Projet
  displaySprintDialog = false;    // Sprints
  displayEquipeDialog = false;    // Equipes
  
  // Objets sélectionnés pour les modales
  selectedTicket?: Ticket;
  selectedProjet?: Projets;
  newProject = new Projets();

  fparam: any;

  ngOnInit(): void {
    const user = this.sessionService.getUser();
    if (user) {
      this.currentUser.set(user);
      // Paramètre de recherche standard (Organisation + Login)
      this.fparam = new FindParam(this.sessionService.getOrganisation(), user.login);
      this.loadDashboard();
    }
  }

  loadDashboard(): void {
    this.loading.set(true);
    const login = this.currentUser()?.login;

    // Critères de base pour les listes
    const criteriaBase = { ...this.fparam, membre: login }; 

    forkJoin({
      // 1. Projets (Membre)
      projets: this.projetService.list(criteriaBase).pipe(catchError(() => of([]))),
      
      // 2. Modules (Niveau 1) - Filtrés par membre si le back le gère, sinon on filtre après
      modules: this.ticketService.list({ ...criteriaBase, niveau: 1 }).pipe(catchError(() => of([]))),

      // 3. US (Niveau 2)
      us: this.ticketService.list({ ...criteriaBase, niveau: 2 }).pipe(catchError(() => of([]))),

      // 4. Tâches (Niveau 3) - Ce qui m'est assigné directement
      taches: this.ticketService.list({ ...criteriaBase, niveau: 3 }).pipe(catchError(() => of([]))),
      
      // 5. Sprint Actif
      sprints: this.sprintService.list({ ...criteriaBase, statut: 'EN_COURS' }).pipe(catchError(() => of([])))
      
    }).pipe(
      finalize(() => {
        this.loading.set(false);
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: any) => {
        this.projects.set(res.projets || []);
        this.myModules.set(res.modules || []);
        this.myUserStories.set(res.us || []);
        
        // Tri des tâches par priorité
        const sortedTasks = (res.taches || []).sort((a: Ticket, b: Ticket) => (b.priorite || 0) - (a.priorite || 0));
        this.myTasks.set(sortedTasks);

        if (res.sprints && res.sprints.length > 0) {
          this.activeSprint.set(res.sprints[0]);
        }

        this.calculateStats(sortedTasks);
      },
      error: (err) => console.error('Erreur chargement dashboard', err)
    });
  }

  calculateStats(tasks: Ticket[]) {
    // Calcul pts de charge (basé sur le champ 'poids' du modèle Ticket)
    const load = tasks.reduce((acc, t) => acc + (t.poids || 0), 0);
    this.totalLoad.set(load);

    // Calcul tâches terminées (Taux 100% ou statut Terminé)
    const done = tasks.filter(t => t.tauxExecution === 100).length;
    this.tasksDoneCount.set(done);
  }

  // --- ACTIONS OUVERTURE MODALES ---

  // 1. Détail Ticket
  openTicketDetails(ticket: Ticket): void {
    this.selectedTicket = { ...ticket };
    this.displayTicketDialog = true;
  }

  // 2. Edition Projet (ou Création)
  openProjetEdit(p?: Projets): void {
    if (p) {
      this.selectedProjet = p;
      this.newProject = { ...p };
    } else {
      this.newProject = new Projets();
      // Init par défaut
      this.newProject.organisationID = this.currentUser().organisationID;
    }
    this.displayProjetDialog = true;
  }

  // 3. Sprints
  openSprints(p: Projets): void {
    this.selectedProjet = { ...p };
    this.displaySprintDialog = true;
  }

  // 4. Equipes
  openEquipes(p: Projets): void {
    this.selectedProjet = { ...p };
    this.displayEquipeDialog = true;
  }

  // --- CALLBACKS FERMETURE ---
  
  closeProjetDialog(saved?: any): void {
    this.displayProjetDialog = false;
    if (saved) { this.loadDashboard(); } // Recharger si modif
  }

  closeTicketDialog(): void {
    this.displayTicketDialog = false;
    this.selectedTicket = undefined;
  }

  // --- HELPERS UI ---

  // Tronquer proprement
  truncateText(text: string, limit: number = 20): string {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }

  // Couleurs statuts (5 jeux de couleurs)
  getStatusClass(ticket: Ticket): string {
    // Logique basée sur votre modèle 'status' (int) ou 'tauxExecution'
    const status = ticket.status || 0;
    const taux = ticket.tauxExecution || 0;

    if (taux === 100) return 'status-green'; // Terminé
    if (status === 50) return 'status-brown'; // Bloqué
    if (status === 40) return 'status-purple'; // En Test
    if (taux > 0) return 'status-blue';      // En Cours
    return 'status-gray';                    // À faire
  }

  getPriorityLabel(p: number | undefined): string {
    // Mapping basé sur Priorite[] de AccueilComponent
    switch(p) {
      case 3: return 'Haute';
      case 2: return 'Moyenne';
      case 1: return 'Basse';
      default: return 'Normale';
    }
  }
}