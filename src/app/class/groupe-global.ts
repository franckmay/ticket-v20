import { Groupe } from "./groupe";
import { Role } from "./role";
import { User } from "./user";


export class GroupeGlobal {
    
    groupe: Groupe = new Groupe();
    users: User[] = [];
    roles : Role [] = [];
}
