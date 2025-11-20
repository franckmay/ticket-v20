export class Ticket {
  ticketID!: string;
  projetID!: string; //select 
  typeTicketID!: string; //select 
  projetLibelle!: string; //select 
  niveau!: number;
  parentID!: string; //select 
  libelleFr!: string;
  libelleUs!: string;
  description!: string;
  criteresqualite!: string;
  priorite!: number;
  etat!: number;
  status!: number;
  statusLibelle!: string;
  prioriteLibelle!: string;
  dateDebut!: string;
  dateFin!: string;
  duree!: string;
  tauxExecution!: number;
  poids!: number;
  code!: string;
  codeOrdre!: number;
  codeParent!: string;
  last_update!: Date;
  user_update!: string;
  ip_update!: string;
  estimation?: number;

  constructor() {
    this.ticketID = `TICK${new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '')
      .replace(/\..*$/, '')}.${Math.floor(Math.random() * 1000)}.${Math.floor(
      Math.random() * 1000
    )}`;
  }
}
