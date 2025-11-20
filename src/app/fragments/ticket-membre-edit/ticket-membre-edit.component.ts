import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SessionStorageService } from '../../services/session/session-storage.service';
import { FindParam } from '../../class/dto/find-param';
import { ApiService } from '../../services/api.service';
import { ProjetMembre } from '../../class/projet-membre';
import { Ticketmembre } from '../../class/ticketmembre';

@Component({
  selector: 'app-ticket-membre-edit',
  templateUrl: './ticket-membre-edit.component.html',
  styleUrls: ['./ticket-membre-edit.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule
  ]
})
export class TicketMembreEditComponent implements OnInit {
  @Input() ticketMembre!: Ticketmembre;
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  projetMembres: ProjetMembre[] = [];
  projetEquipes: any

  loading = false;
  loadingEquipes = false;
  loadingMembres = false;

  fparam: FindParam;
  constructor(public translate: TranslateService, private ts: SessionStorageService, private api: ApiService) {
    this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser().login);
  }
  //=================================================================================
  ngOnInit(): void { this.listEquipes(); console.log(this.ticketMembre); if (this.ticketMembre!.projetequipeID) { this.listMembreByEquipe(this.ticketMembre.projetequipeID); } }

  listEquipes() { this.loadingEquipes = true; this.api.projetEquipeList({ projetID: this.ticketMembre!.projetID }).subscribe((data) => { this.projetEquipes = data; this.loadingEquipes = false; }); }

  onEquipeChange(projetequipeID: string) {
    if (projetequipeID) { this.listMembreByEquipe(projetequipeID); } else { this.projetMembres = []; }
  }

  listMembreByEquipe(projetequipeID: string) {
    this.loadingMembres = true;
    this.api.membreListByEquipe({ organisationID: this.fparam.organisationID || '', projetequipeID: projetequipeID, })
      .subscribe({
        next: (data) => { this.projetMembres = data; this.loadingMembres = false; },
        error: (err) => { console.error(err); this.loadingMembres = false; }
      });
  }
  //=================================================================================

  detDuree(): void {
    if (this.ticketMembre!.dateDebut && this.ticketMembre!.dateFin) {
      const d1 = new Date(this.ticketMembre!.dateDebut);
      const d2 = new Date(this.ticketMembre!.dateFin);
      const diffMs = d2.getTime() - d1.getTime();
      const jours = Math.round(diffMs / (1000 * 60 * 60 * 24));
      this.ticketMembre!.dureeDelai = `${jours} jour${jours > 1 ? 's' : ''}`;
    } else {
      this.ticketMembre!.dureeDelai = '';
    }
  }
  //=================================================================================

  onSave(form: NgForm): void {
    if (form.invalid) { this.loading = false; form.control.markAllAsTouched(); return; }
    this.loading = true;
    this.api.ticketMembreInsert({ ...this.ticketMembre, user_update: this.fparam.login, })
      .subscribe({
        next: (data) => { this.loading = false; this.save.emit({ ...this.ticketMembre }); },
        error: (err) => { console.error(err); this.loading = false; }
      });
  }

  //=================================================================================
  onCancel() { this.resetForm(); this.cancel.emit(); }
  resetForm() { this.ticketMembre = new Ticketmembre(); }
}