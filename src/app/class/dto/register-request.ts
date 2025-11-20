import { Organisation } from "../organisation";
import { User } from "../user";

export class RegisterRequest {

    utilisateur = new User();
    entitedeclarante = new Organisation();
}
