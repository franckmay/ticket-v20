import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {

  private sounds: { [key: string]: HTMLAudioElement } = {};

  constructor() {
    // Charger les sons au démarrage
    this.sounds['click'] = new Audio('assets/sounds/click.mp3');
    this.sounds['success'] = new Audio('assets/sounds/success.mp3');
    this.sounds['error'] = new Audio('assets/sounds/error.mp3');
    this.sounds['delete'] = new Audio('assets/sounds/delete.mp3');
    this.sounds['attention'] = new Audio('assets/sounds/attention.mp3');
  }

  playSound(soundKey: string): void {
    const sound = this.sounds[soundKey];
    if (sound) {
      sound.currentTime = 0; // Rejouer depuis le début
      sound.play().catch(err => console.error('Erreur lors de la lecture du son:', err));
    }
  }
}
