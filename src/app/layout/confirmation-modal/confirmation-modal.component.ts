import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalData } from '../modalService';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true, // <--- Transformation en Standalone
  imports: [CommonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationModalComponent {
  @Input() showModal: boolean = false;
  @Input() modalData: ConfirmationModalData | null = null;

  @Output() confirmClick = new EventEmitter<void>();
  @Output() cancelClick = new EventEmitter<void>();

  confirm(): void { this.confirmClick.emit(); }
  cancel(): void { this.cancelClick.emit(); }
}