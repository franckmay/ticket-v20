
import { SprintTicket } from './sprint-ticket';

export class Sprint {
  sprintID!: string;
  projetID!: string;
  organisationID!: string;
  nom!: string;
  dateDebut!: string;
  dateFin!: string;
  objectif!: string;
  projetLibelle!: string;
  velocity!: number;
  organisationLibelle!: string;
  user_update!: string;
  last_update!: string;
  etat!: number; 
  sprintTickets:SprintTicket[]=[]
}