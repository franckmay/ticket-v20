
import { User } from "../user";
import { Permission } from "./permission";

export class Groupe {
    id!: string;
    nom!: string;
    code!: string;
    codeParent!: string;
    description!: string;
    lastUpdate!: string;
  
    permissions !: Permission [] | null
    utilisateurs !: User [] | null
}