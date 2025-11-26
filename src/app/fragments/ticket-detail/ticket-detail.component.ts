import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket } from '../../class/ticket';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class TicketDetailComponent implements OnInit, OnChanges {
  @Input() ticket!: Ticket;

  ticketMembres: any[] = [];
  loading = false;

  constructor(private api: ApiService) { }

  ngOnInit(): void { 
    this.refreshData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Recharger les affectations si le ticket change (cas navigation sans destruction composant)
    if (changes['ticket'] && !changes['ticket'].firstChange) {
      this.refreshData();
    }
  }

  refreshData() {
    if (this.ticket && this.ticket.ticketID) { 
      this.listerAffectations(); 
    }
  }

  listerAffectations(): void {
    this.loading = true;
    this.api.ticketMembreList({ ticketID: this.ticket.ticketID }).subscribe({
      next: (data) => {
        this.ticketMembres = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement membres', err);
        this.loading = false;
      }
    });
  }

  getTitre(niveau: number): string {
    switch (niveau) {
      case 1: return 'Module';
      case 2: return 'User Story';
      case 3: return 'Tâche';
      default: return 'Niveau ' + niveau;
    }
  }

  getStatusClass(status: number | undefined): string {
    if (!status) return 'bg-secondary';
    switch (status) {
      case 10: return 'bg-secondary'; // A faire
      case 20: return 'bg-primary';   // En cours
      case 40: return 'bg-success';   // Terminé
      case 50: return 'bg-dark';      // Archivé
      case 90: return 'bg-danger';    // Bloqué
      default: return 'bg-secondary';
    }
  }
}