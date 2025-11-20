import { Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { User } from '../../class/user';
import { AuthService } from '../../services/auth/_services/auth.service';
import { interval, Subscription } from 'rxjs';
import { UserRegister } from '../../class/dto/user-register';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule
  ]
})
export class RegisterComponent {

  user = new User();
  userRegister = new UserRegister();
  form: any = {
    organisationID: null,
    prenom: null,
    nom: null,
    email: null,
    telephone: null,
    password: null,
    fonction: null,
    service: null,
    confirmPassword: null
  };

  waiter = false;
  loading = false;
  errorMessage = '';
  loadingText = 'chargement';
  stepIndex = 1;
  utilisateur = new User();
  acceptedTerms = false;

  // Gestion OTP
  otpDigits: string[] = new Array(6).fill('');
  @ViewChildren('otpInput') inputs!: QueryList<ElementRef>;
  otpRes = '';
  modeVerif = 1;
  timer: number = 300;
  timerDisplay: string = '05:00';
  timerSubscription: Subscription | null = null;

  // Visibilité des mots de passe
  vuec = false;
  vuecConfirm = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public translate: TranslateService,
    private ts: SessionStorageService,
    private api: AuthService
  ) {
    this.translate.setDefaultLang('fr');
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';

    // Validation des mots de passe
    if (this.form.password !== this.form.confirmPassword) {
      this.errorMessage = 'passwords_mismatch';
      this.loading = false;
      return;
    }

    // Préparation des données
    const registrationData = {
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      email: this.form.email,
      phone: this.form.phone,
      password: this.form.password
    };

    this.api.register(registrationData).subscribe({
      next: (data: any) => {
        this.nextStep();
        this.startTimer();
        this.user = data.user;
        this.otpRes = data.otpCode || '';
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Registration error:', error);
        this.handleRegistrationError(error);
        this.loading = false;
      }
    });
  }

  private handleRegistrationError(error: any): void {
    if (error.status === 409) {
      this.errorMessage = 'email_already_exists';
    } else if (error.status === 400) {
      this.errorMessage = 'invalid_data_format';
    } else {
      this.errorMessage = 'registration_failed';
    }
  }

  togglePasswordVisibility(): void {
    this.vuec = !this.vuec;
  }

  toggleConfirmPasswordVisibility(): void {
    this.vuecConfirm = !this.vuecConfirm;
  }

  // Méthodes OTP (similaires au login)
  verifierCode() {
    if (this.otpRes === this.otpValue) {
      this.loading = true;
      this.api.confirmCode({ login: this.user.login, otpCode: this.otpValue }).subscribe({
        next: (data: any) => {
          this.loading = false;
          this.handleSuccessfulRegistration(data);
        },
        error: (error: any) => {
          console.error(error);
          window.alert(this.translate.instant('erreur_verification'));
          this.loading = false;
        }
      });
    } else {
      window.alert(this.translate.instant('code_incorrect'));
    }
  }

  private handleSuccessfulRegistration(data: any): void {
    if (data?.user) {
      this.ts.saveUser(data.user);
      this.router.navigate(['/login']);
    }
  }

  renvoyerCode() { this.sendVerificationCode(this.modeVerif); this.startTimer(); this.otpValue = ''; }
  sendVerificationCode(m: number) {
    this.modeVerif = m;
    this.loading = true;
    this.api.sendCode({ ...this.userRegister, methode: this.modeVerif }).subscribe({
      next: (data: any) => {this.loading = false; console.log('Code renvoyé'); },
      error: (error: any) => { console.error(error); window.alert(this.translate.instant('erreur')); this.loading = false; },
      complete: () => { console.info('complete'); this.loading = false; }
    });
  }
  // Méthodes de gestion du timer
  startTimer(): void {
    this.stopTimer();
    this.timer = 300;
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.timer > 0) {
        this.timer--;
        this.timerDisplay = this.formatTimer(this.timer);
      } else {
        this.stopTimer();
      }
    });
  }

  stopTimer(): void {
    this.timerSubscription?.unsubscribe();
  }

  formatTimer(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Navigation entre les étapes
  nextStep(): void {
    if (this.stepIndex < 2) this.stepIndex++;
  }

  previousStep(): void {
    if (this.stepIndex > 1) this.stepIndex--;
  }

  // Gestion OTP (identique au login)
  get otpValue(): string {
    return this.otpDigits.join('');
  }

  set otpValue(value: string) {
    this.otpDigits = value.split('').slice(0, 6);
  }

  onInput(event: any, index: number): void {
    const value = event.target.value;
    if (value.length === 1 && index < 5) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }
    this.otpValue = this.otpDigits.join('');
  }

  onBackspace(index: number): void {
    if (this.otpDigits[index] === '' && index > 0) {
      this.inputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      this.otpDigits = pastedData.split('').concat(new Array(6 - pastedData.length).fill(''));
      this.inputs.last.nativeElement.focus();
    }
  }
}