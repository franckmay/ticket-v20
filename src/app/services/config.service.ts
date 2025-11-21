import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AppConfig {
  serverIP: string;
  [key: string]: any; // Permet d'autres clés éventuelles
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private config = {} as AppConfig;
  loaded = false;

  constructor(private http: HttpClient) { }

  loadConfig(): Promise<AppConfig> {
    console.log('ConfigService: Démarrage du chargement de la configuration...');

    // Le dossier 'public' est servi à la racine '/', donc le chemin est simplement '/app.config.json'
    return firstValueFrom(
      this.http.get<AppConfig>('/app.config.json').pipe(
        tap(data => {
          console.log('ConfigService: Fichier lu avec succès !', data);
          this.config = data;
          this.loaded = true;
        })
      )
    ).catch(error => {
      console.error('ConfigService: Erreur critique lors de la lecture de app.config.json', error);
      // On relance l'erreur pour bloquer l'appli si la config est vitale, 
      // ou on définit une config par défaut ici.
      return Promise.reject(error);
    });
  }

  getConfig(): AppConfig {
    return this.config;
  }
}