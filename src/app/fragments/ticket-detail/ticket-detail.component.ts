import { Component, Input, OnInit } from '@angular/core';
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
export class TicketDetailComponent implements OnInit {
  @Input() ticket!: Ticket;

  attachments: any;
  ticketMembres: any;
  loading = false;

  constructor(private api: ApiService) { }

  ngOnInit(): void { if (this.ticket && this.ticket.ticketID) { this.listerAffectations(); } }

  listerAffectations(): void {
    this.loading = true;
    this.api.ticketMembreList({ ticketID: this.ticket.ticketID }).subscribe({
      next: (data) => {
        this.ticketMembres = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  getTitre(niveau: number): string {
    switch (niveau) {
      case 1: return 'Module';
      case 2: return 'USER STORY';
      case 3: return 'TÂCHE';
      default: return 'NIVEAU ' + niveau;
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 10:
        return 'bg-secondary';
      case 20:
        return 'bg-primary';
      case 40:
        return 'bg-success';
      case 50:
        return 'bg-dark';

      default:
        return 'bg-light';
    }
  }
}