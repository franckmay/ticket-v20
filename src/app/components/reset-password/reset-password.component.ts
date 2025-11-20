import { Component, ElementRef, HostListener, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { interval, Subscription } from 'rxjs';

import { User } from '../../class/user';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { AuthService } from '../../services/auth/_services/auth.service';
import { UserRegister } from '../../class/dto/user-register';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule
  ]
})
export class ResetPasswordComponent {

  user = new User();
  userRegister = new UserRegister();
  form: any = { email: null };
  passwordForm: any = { password: null };
  stepIndex = 1;
  modeVerif = 1; // 1: Email, 2: SMS
  otpRes = '';
  timer = 300; // 5 minutes
  timerDisplay = '05:00';
  timerSubscription: Subscription | null = null;
  loading = false;
  unknowEmail = false;


  constructor(
    private router: Router,
    public translate: TranslateService,
    private ts: SessionStorageService,
    private api: AuthService
  ) {
    this.translate.setDefaultLang('fr');
    this.translate.use('fr');
  }

  // Timer management
  startTimer(): void {
    this.stopTimer();
    this.timer = 300;
    this.timerSubscription = interval(1000).subscribe(() => {
      this.timer--;
      this.timerDisplay = this.formatTimer(this.timer);
      if (this.timer <= 0) {
        this.stopTimer();
      }
    });
  }

  stopTimer(): void { if (this.timerSubscription) { this.timerSubscription.unsubscribe(); } }

  formatTimer(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Step navigation
  nextStep(): void { if (this.stepIndex < 4) { this.stepIndex++; } }

  previousStep(): void { if (this.stepIndex > 1) { this.stepIndex--; } }

  // Step 1: Submit email
  onSubmitEmail(): void {
    this.loading = true;
    this.api.utilisateurBasicDetail(this.form.email).subscribe({
      next: (data: any) => {
        this.loading = false;
        this.user = data;
        this.nextStep();
      },
      error: (error: any) => {
        this.loading = false;
        this.showErrorDialog('error_send_code');
      }
    });
  }

  // Step 2: Choose verification method
  sendVerificationCode(): void {
    this.startTimer();
    this.loading = true;
    this.api.sendCode({ ...this.userRegister, user: this.user, methode: this.modeVerif }).subscribe({
      next: (data: any) => {
        this.loading = false;
        this.saveToken(data);
        this.nextStep();
      },
      error: () => { this.loading = false; this.showErrorDialog('error_resend_code'); }
    });
  }

  // Step 3: Verify code
  verifyResetCode(): void {
    if (this.otpValue === this.otpRes) {
      this.loading = true;
      this.api.verifyResetCode({ ...this.userRegister, user: this.user, otpCode: this.otpValue }).subscribe({
        next: () => { this.loading = false; this.nextStep(); },
        error: () => { this.loading = false; this.showErrorDialog('error_verification'); }
      });
    } else {
      this.showErrorDialog('incorrect_code');
    }
  }

  // Step 4: reset with new password
  resetPass() {
    if (this.validerPass) {
      this.loading = true;
      const { password } = this.passwordForm;
      this.api.resetPassword({ ...this.userRegister, user: { ...this.user, motDePasse: password }, password: this.form.password }).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/login']);
        },
        error: (error: any) => {
          this.loading = false;
          this.showErrorDialog(error.error);
        }
      });
    }
  }

  renvoyerCode() {
    this.startTimer();
    this.loading = true;
    this.api.sendCode({ ...this.userRegister, user: this.user, methode: this.modeVerif }).subscribe({
      next: (data: any) => { this.loading = false; this.saveToken(data); },
      error: () => { this.loading = false; this.showErrorDialog('error_resend_code'); }
    });
  }

  saveToken(data: any): void {
    if (data && data.jwt && typeof data.jwt === 'string') {
      // Stocker uniquement le token JWT sous forme de chaîne dans le localStorage
      localStorage.setItem('token', data.jwt);
      console.log('Token JWT sauvegardé avec succès:', data.jwt);
      this.otpRes = data.otpCode || '';
    }
  }

  //--------------------------------------------------------------------------------
  maskEmail(email: string): string {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.slice(0, 2) + '*'.repeat(Math.max(localPart.length - 2, 1));
    return `${maskedLocal}@${domain}`;
  }

  maskPhone(phone: string): string {
    if (!phone) return '';
    return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3);
  }

  //--------------------------------------------------------------------------------
  passRegex: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,30}$/;

  get validerPass(): boolean { return this.passRegex.test(this.passwordForm.password); }

  //--------------------------------------------------------------------------------


  successMessage = 'Success'
  errorMessage = 'error'
  displaySucces = false;
  displayError = false;
  showSuccesDialog(message: string) { this.successMessage = message; this.displaySucces = true; }
  closeSucces() { this.displaySucces = false; }

  showErrorDialog(message: string) { this.errorMessage = message; this.displayError = true; }
  closeError() { this.displayError = false; }




  
// Getter/Setter pour la compatibilité avec l'ancien code
get otpValue(): string {
    return this.otpDigits.join('');
}

set otpValue(value: string) {
    this.otpDigits = value.split('').slice(0, 6);
    while (this.otpDigits.length < 6) this.otpDigits.push('');
}

otpDigits: string[] = new Array(6).fill('');
  @ViewChildren('otpInput') inputs!: QueryList<ElementRef>;

  onInput(event: any, index: number) {
    const value = event.target.value;
    
    // Déplacement automatique vers le champ suivant
    if (value.length === 1 && index < 5) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }
    
    // Mise à jour de la valeur complète
    this.otpValue = this.otpDigits.join('');
  }

  onBackspace(index: number) {
    if (this.otpDigits[index] === '' && index > 0) {
      this.inputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  // Gestion améliorée du collage
  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').replace(/\D/g,'').slice(0,6);
    
    if (pastedData) {
      pastedData.split('').forEach((char, i) => {
        if (i < 6) this.otpDigits[i] = char;
      });
      
      this.otpValue = this.otpDigits.join('');
      this.inputs.last.nativeElement.focus();
    }
  }
}