import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Organisation } from '../../class/organisation';
import { User } from '../../class/user';
import { AuthService } from '../../services/auth/_services/auth.service';
import { ApiService } from '../../services/api.service';
import { FindParam } from '../../class/dto/find-param';
import { SessionStorageService } from '../../services/session/session-storage.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ]
})
export class UserManagementComponent implements OnInit {

  users: User[] = [];
  organisations: Organisation[] = [];
  filterText = '';
  filterOrganisationID = '';

  userForm: FormGroup;
  submitted = false;
  editing = false;
  showForm = false;
  showDeleteConfirm = false;
  showPass = false;
  showConfirm = false;
  loading = false;

  selectedUser: User | null = null;
  formError = '';
  private idCounter = 1;
  fparam: any;
  constructor(private fb: FormBuilder, private ts: SessionStorageService, private auth: AuthService, private api: ApiService) {
    this.userForm = this.fb.group({
      login: ['', Validators.required],
      organisationID: ['', Validators.required],
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      immatriculation: [''],
      fonction: [''],
      service: [''],
      password: [''],
      confirmPassword: ['']
    });
    this.fparam = new FindParam(this.ts.getOrganisation(), this.ts.getUser().login);
  }

  ngOnInit(): void { this.loadUsers(); this.organisationList(); }
  actualiser(): void { this.loadUsers(); this.organisationList(); }
  //--------------------------------------------------------------------------------

  loadUsers() {
    this.loading = true;
    this.api.userList({ organisationID: this.fparam.organisationID }).subscribe({
      next: (data: any) => { this.loading = false; this.users = data; console.log(data); },
      error: (error: any) => { console.error(error); this.loading = false; }
    });
  }

  //--------------------------------------------------------------------------------
  organisationList() {
    this.api.organisationList().subscribe({
      next: (data: any) => { this.organisations = data; },
      error: (error: any) => { console.error(error); }
    });
  }

  //--------------------------------------------------------------------------------

  openForm(): void {
    this.editing = false;
    this.submitted = false;
    this.formError = '';
    this.userForm.reset();
    this.showForm = true;
  }

  editUser(user: User): void {
    this.editing = true;
    this.submitted = false;
    this.formError = '';
    this.selectedUser = user;
    this.userForm.patchValue({
      organisationID: user.organisationID,
      immatriculation: user.immatriculation,
      fonction: user.fonction,
      service: user.service,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      telephone: user.telephone,
      password: '',
      confirmPassword: ''
    });
    this.showForm = true;
  }

  saveUser(): void {
    this.submitted = true; this.userForm.markAllAsTouched();
    if (this.userForm.invalid) {
      console.group('▶ Form invalid – diagnostics');
      console.log('Form status:', this.userForm.status);
      console.log('Form errors:', this.userForm.errors);
      Object.keys(this.userForm.controls).forEach(name => {
        const ctrl = this.userForm.get(name)!;
        if (ctrl.errors) { console.log(`— ${name}:`, ctrl.errors); }
      });
      console.groupEnd();
      return;
    }

    else {
      this.loading = true;
      const values = this.userForm.value;
      if (this.editing && this.selectedUser) {
        const updated = { ...this.selectedUser, ...values };
        this.api.userUpdate({ ...updated, user_update: this.fparam.login }).subscribe({
          error: (error: any) => { console.error(error); this.showError(error.error.error); this.loading = false; },
          complete: () => { this.loading = false; this.closeForm(); }
        });

      } else {
        const newUser: User = {
          login: values.login,
          organisationID: values.organisationID,
          immatriculation: values.immatriculation,
          fonction: values.fonction,
          service: values.service,
          prenom: values.prenom,
          nom: values.nom,
          email: values.email,
          telephone: values.telephone,
          password: values.password,
          user_update: this.fparam.login
        };
        this.api.userInsert(newUser).subscribe({
          error: (error: any) => { console.error(error); this.showError(error.error.error); this.loading = false; },
          complete: () => { this.loading = false; this.closeForm(); }
        });
      }
    }
  }

  closeForm(): void { this.showForm = false; this.selectedUser = null; this.loadUsers() }

  confirmDelete(user: User): void { this.selectedUser = user; this.showDeleteConfirm = true; }

  deleteUser(): void {
    if (!this.selectedUser) { return; }
    else {
      this.loading = true; this.showDeleteConfirm = false;
      this.api.userDelete(this.selectedUser.login!).subscribe({
        error: (error: any) => { console.error(error); this.loading = false; this.showError(error.error.error) },
        complete: () => {
          this.loading = false; this.users = this.users.filter(u => u !== this.selectedUser); this.cancelDelete();
        }
      });
    }
  }

  cancelDelete(): void { this.showDeleteConfirm = false; this.selectedUser = null; }

  private getOrgName(id: string): string {
    const org = this.organisations.find(o => o.organisationID === id);
    return org ? org.libelleFr : '';
  }
  //--------------------------------------------------------------------------------

  passRegex: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[a-zA-Z\d\W_]{6,30}$/;
  confirmPassword = ''

  get passwordsMatch(): boolean { return this.userForm.value.password === this.userForm.value.confirmPassword; }

  get validerPass(): boolean { return this.passRegex.test(this.userForm.value.password) }
  //--------------------------------------------------------------------------------


  /**
   * Vérifie si l'email est valide en utilisant une expression régulière.
   * @param email L'email à vérifier
   * @returns true si l'email est valide, sinon false
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex standard pour un email valide
    return emailRegex.test(email);
  }
  //--------------------------------------------------------------------------------
  onEmailBlur(): void {
    const login = this.generateLoginFromEmail();
    if (login) {
      this.userForm.patchValue({ login });
    }
  }


  generateLoginFromEmail(): string {
    const email: string = this.userForm.get('email')?.value ?? '';
    if (!this.isValidEmail(email)) {
      console.warn(`Email invalide (${email}), login non généré.`);
      return '';
    }
    const localPart = email.split('@')[0];
    return `greco.${localPart}`;
  }


  //--------------------------------------------------------------------------------

  errorMessage = ''
  displayError = false;
  showError(message: string) { this.displayError = true; this.errorMessage = message; }
  closeError() { this.displayError = false; }
}