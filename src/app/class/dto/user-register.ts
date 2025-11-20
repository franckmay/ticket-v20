import { User } from "../user";


export class UserRegister {
    jwt!: string;
    otpCode!: string;
    methode!: number;
    utilisateur = new User();
}