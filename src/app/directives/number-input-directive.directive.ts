import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: 'input[type=number][appNumberInput]'
})
export class NumberInputDirective {

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const inputElement = event.target as HTMLInputElement;
    const value = Number(inputElement.value + event.key);

    /* if ((!Number.isNaN(value) && (value < 0 || value > 100)) || (event.key === '.' && inputElement.value.includes('.'))) {
      event.preventDefault();
    } */

    if ((!Number.isNaN(value) && (value < 0 || value > 100)) || isNaN(Number(event.key)) && event.key !== '.' && event.key !== 'Backspace' && event.key !== 'Delete') {
      event.preventDefault();
    }
  }

}
