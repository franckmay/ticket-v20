export class FindParam {
    login!: string;
    organisationID!: string;
    entiteCategorieID!: string;
    reference!: string;
    categorie!: string;
    code!: string;
    typeID!: string;
    type!: number;
    etat!: number;
    priorite!: number;
    objet!: string;
    autre!: string;
    periode!: string;
    dateDebut!: string;
    dateFin!: string;
    day!: string;
    month!: string;
    year!: string;
    typeUtilisateur!: string;
    typeRecherche!: string | null;

    projetequipeID!: string;
    proprietaireID!: string;
    status!: number;

    constructor(_entite: string, _id: string) {
        this.login = _id
        this.organisationID = _entite
    }

}
