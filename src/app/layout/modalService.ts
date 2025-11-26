
import { Injectable, ViewContainerRef, ComponentRef } from '@angular/core';
import { StatusModalComponent, ModalType } from './status-modal/status-modal.component';
import { ConfirmationModalComponent } from './confirmation-modal/confirmation-modal.component';
import { Observable } from 'rxjs';


export interface ConfirmationModalData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmIcon?: string; 
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private viewContainerRef: ViewContainerRef | null = null;
  // La référence est maintenant privée et gérée dynamiquement
  private statusModalRef: ComponentRef<StatusModalComponent> | null = null;

  constructor() { }

  public setRootViewContainerRef(vcr: ViewContainerRef): void {
    if (!vcr) {
      console.error('ViewContainerRef fourni est invalide.');
      return;
    }
    this.viewContainerRef = vcr;
  }

  /**
   * Crée et affiche dynamiquement une modale de statut.
   */
  public showStatusModal(type: ModalType, title: string, message: string): void {
    if (!this.viewContainerRef) {
      console.error('ViewContainerRef non défini. Appelez setRootViewContainerRef() avant d\'utiliser le service.');
      return;
    }

    // Si une modale de statut est déjà ouverte, on la détruit avant d'en créer une nouvelle.
    if (this.statusModalRef) {
      this.hideStatusModal();
    }

    // Crée le composant dynamiquement
    this.statusModalRef = this.viewContainerRef.createComponent(StatusModalComponent);
    const instance = this.statusModalRef.instance;


    
    // Passe les données via les @Inputs
    instance.type = type;
    instance.title = title;
    instance.message = message;
    instance.showModal = true; // Déclenche l'affichage

    // On écoute l'événement de fermeture pour détruire le composant
    const closeSubscription = instance.closeClick.subscribe(() => {
      this.hideStatusModal();
      closeSubscription.unsubscribe();
    });
  }

  /**
   * Détruit la modale de statut si elle existe.
   */
  public hideStatusModal(): void {
    if (this.statusModalRef) {
      this.statusModalRef.destroy();
      this.statusModalRef = null;
    }
  }

  /**
   * Ouvre une modale de confirmation et retourne un Observable.
   */
  public confirm(data: ConfirmationModalData): Observable<boolean> {
    return new Observable<boolean>(observer => {
      if (!this.viewContainerRef) {
        console.error('ViewContainerRef non défini. Appelez setRootViewContainerRef() avant d\'utiliser le service.');
        observer.error('ViewContainerRef not set');
        return;
      }

      const confirmationModalRef = this.viewContainerRef.createComponent(ConfirmationModalComponent);
      const instance = confirmationModalRef.instance;

      instance.modalData = data;
      instance.showModal = true;

      const confirmSubscription = instance.confirmClick.subscribe(() => {
        observer.next(true);
        observer.complete();
      });

      const cancelSubscription = instance.cancelClick.subscribe(() => {
        observer.next(false);
        observer.complete();
      });

      return () => { // Fonction de nettoyage
        confirmSubscription.unsubscribe();
        cancelSubscription.unsubscribe();
        if (confirmationModalRef) {
          confirmationModalRef.destroy();
        }
      };
    });
  }
}
