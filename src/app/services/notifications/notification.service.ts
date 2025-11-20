import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ConfigService } from '../config.service';

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private socket!: WebSocket;
    private notificationsSubject: Subject<string> = new Subject();

    constructor(private appConfigService: ConfigService) {
        const fullUrl = this.appConfigService.getConfig().serverIP;
        const serverAddress = this.extractServerAddress(fullUrl);
        const token = localStorage.getItem('token');
        // if (token) {
        //     this.connect(serverAddress, token);
        // } else {
        //     console.warn("Aucun token JWT trouvé. WebSocket non initialisé.");
        // }
    }

    /**
     * Extrait l'adresse serveur
     */
    private extractServerAddress(fullUrl: string): string {
        try {
            const url = new URL(fullUrl);
            return `${url.hostname}:${url.port}`; // Ex: "192.168.0.103:8080"
        } catch (error) {
            console.error("Erreur lors de l'extraction de l'adresse serveur", error);
            return "localhost:8080"; // Valeur par défaut en cas d'erreur
        }
    }

    /** * Connexion au WebSocket avec Token dans l'URL */
    private connect(serverAddress: string, token: string) {
        const wsUrl = `ws://${serverAddress}/ws-notifications?token=${token}`;

        this.socket = new WebSocket(wsUrl); // Suppression du header Authorization

        this.socket.onopen = () => console.log('✅ WebSocket connecté');

        this.socket.onmessage = (event) => {
            this.notificationsSubject.next(event.data);
        };
        this.socket.onclose = () => {
            console.log('❌ WebSocket fermé. Tentative de reconnexion...');
            setTimeout(() => this.connect(serverAddress, token), 15000);
        };
    }

    /** * Déconnexion propre du WebSocket */
    public disconnect() {
        if (this.socket) {
            console.log('🔌 Déconnexion du WebSocket...');
            this.socket.onclose = null; // Empêche la reconnexion automatique
            this.socket.close(); // Ferme la connexion proprement
        }
    }
    
    public getNotifications() {
        return this.notificationsSubject.asObservable();
    }

    public sendNotification(message: string) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.warn('⚠️ WebSocket non connecté.');
        }
    }
}
