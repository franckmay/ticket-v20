import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogService } from 'primeng/dynamicdialog';

// Services & Classes
import { FindParam } from '../../class/dto/find-param';
import { Priorite } from '../../class/priorite';
import { ApiService } from '../../services/api.service';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { Projets } from '../../class/projets';

@Component({
  selector: 'app-projet-edit',
  templateUrl: './projet-edit.component.html',
  styleUrls: ['./projet-edit.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    // PrimeNG Modules
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule
  ],
  // DialogService est souvent nécessaire dans les providers si utilisé via injection
  providers: [DialogService] 
})
export class ProjetEditComponent implements OnInit {

  @Input() projet!: Projets;
  @Input() action!: string;
  @Output() saveProjetEvent = new EventEmitter<Projets>();
  @Output() backEvent = new EventEmitter<void>();


  priorites: Priorite[] = [];


  actionPJ = 'newPJ';
  acte = 1;
  options: any[] = [];

  displaySpinner: boolean = false;

  etat: number | null = null;
  status: number | null = null;

  optionsStatus = [
    { value: '10', label: 'En attente' },
    { value: '20', label: 'En cours' },
    { value: '30', label: 'Réouvert' },
    { value: '40', label: 'Résolu' },
    { value: '50', label: 'Fermé' },
  ];

  optionsEtat = [
    { value: '10', label: 'En attente' },
    { value: '20', label: 'En cours' },
    { value: '30', label: 'Réouvert' },
    { value: '40', label: 'Résolu' },
    { value: '50', label: 'Fermé' },
  ];

  fparam: any;

  constructor(private api: ApiService, private ts: SessionStorageService,
    public translate: TranslateService, public route: ActivatedRoute, public dialogService: DialogService) { this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser().login); }


  ngOnInit() { this.reload() }
  //------------------------------------------------------------------------------------------------------------------------------------

  reload() { this.listPriorite(); }
  //------------------------------------------------------------------------------------------------------------------------------------
  listPriorite() { this.displaySpinner = true; this.api.prioriteList().subscribe((data) => { this.priorites = data; this.displaySpinner = false; }); }
  //------------------------------------------------------------------------------------------------------------------------------------

  saveProjet(form: NgForm) {
    if (form.invalid) { form.control.markAllAsTouched(); this.displaySpinner = false; return; }
    this.displaySpinner = true;
    this.api.projetInsert({ ...this.projet, user_update: this.ts.getUser().login })
      .subscribe({
        next: () => { this.displaySpinner = false; this.saveProjetEvent.emit(this.projet); },
        error: (error) => { console.error(error.error); this.displaySpinner = false; alert("erreur lors d'insertion"); }
      });
  }

  //==========================================================================================

  computeDuree(): void {
    if (this.projet.dateDebut && this.projet.dateFin) {
      const d1 = new Date(this.projet.dateDebut);
      const d2 = new Date(this.projet.dateFin);
      const diffMs = d2.getTime() - d1.getTime();
      const jours = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (jours < 0) { this.projet.duree = ''; return; }

      if (jours >= 30) {
        const mois = Math.floor(jours / 30);
        const resteJours = jours % 30;
        let duree = [];
        if (mois > 0) {
          duree.push(`${mois} mois`);
        }
        if (resteJours > 0) {
          duree.push(`${resteJours} jour${resteJours > 1 ? 's' : ''}`);
        }
        this.projet.duree = duree.join(' et ');
      }
      else { this.projet.duree = jours === 0 ? '0 jour' : `${jours} jour${jours > 1 ? 's' : ''}`; }
    } else { this.projet.duree = ''; }
  }

  //------------------------------------------------------------------------------------------------

  successMessage = ''; displaySucces = false; errorMessage = ''; displayError = false;
  showSuccesDialog(message: string) { this.successMessage = message; this.displaySucces = true; }
  closeSucces() { this.displaySucces = false; }

  showErrorDialog(message: string) { this.errorMessage = message; this.displayError = true; }
  closeError() { this.displayError = false; }
  //==========================================================================================

  backToList() { this.backEvent.emit(); }

}