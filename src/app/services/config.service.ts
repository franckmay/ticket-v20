import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


export interface AppConfig {
  serverIP: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private config = {} as AppConfig;
  loaded = false;
  constructor(private http: HttpClient) { }
  loadConfig(): Promise<void> {
    return this.http
      .get<AppConfig>('./assets/app.config.json')
      .toPromise()
      .then(data => {
        if (data) {
          this.config = data; this.loaded = true;
        }
      });
  }

  getConfig(): AppConfig { return this.config; }
}

