import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'input[type=number][appMaxCompte]'
})
export class NumberMaxDirectiveDirective {
  @Input() maxValue = 0; // Valeur maximale autorisée

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const inputElement = event.target as HTMLInputElement;
    const value = Number(inputElement.value + event.key);

    // Vérification de la valeur saisie et des touches autorisées
    if (
      (!Number.isNaN(value) && value >= this.maxValue) || // Vérifie si la valeur dépasse la valeur maximale
      (event.key === '.' && inputElement.value.includes('.')) || // Empêche plusieurs points
      (isNaN(Number(event.key)) && event.key !== 'Backspace' && event.key !== 'Delete') // Empêche les caractères non numériques
    ) {
      event.preventDefault();
    }
  }
}