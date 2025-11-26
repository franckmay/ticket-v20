import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import nécessaire pour standalone

export type ModalType = 'success' | 'error' | 'info' | 'loading' | 'warning' | '';

@Component({
  selector: 'app-status-modal',
  standalone: true, // <--- Transformation en Standalone
  imports: [CommonModule], // <--- Import des directives de base (*ngIf, ngClass)
  templateUrl: './status-modal.component.html',
  styleUrls: ['./status-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusModalComponent {
  @Input() showModal: boolean = false;
  @Input() type: ModalType = '';
  @Input() title: string = '';
  @Input() message: string = '';

  @Output() closeClick = new EventEmitter<void>();

  close(): void {
    this.closeClick.emit();
  }
}