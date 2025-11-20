import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AccueilComponent } from './components/accueil/accueil.component';
import { ItemsComponent } from './components/items/items.component';
import { MainComponent } from './components/main/main.component';
import { ProjectVueComponent } from './components/project-vue/project-vue.component';
import { ProjetsComponent } from './components/projets/projets.component';
import { RegisterComponent } from './components/register/register.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { SprintComponent } from './components/sprint/sprint.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { LoginActivateGuard } from './services/login-activate.guard';

export const routes: Routes = [
    
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'resetpassword', component: ResetPasswordComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'accueil', component: MainComponent,
    canActivate: [LoginActivateGuard],
    children: [
      { path: '', component: AccueilComponent },
      { path: 'acc', component: ProjectVueComponent },
      { path: 'accueil', component: AccueilComponent },
      { path: 'adminUser', component: UserManagementComponent },
      { path: 'userstories', component: ItemsComponent },
      { path: 'projets', component: ProjetsComponent },
      { path: 'sprints', component: SprintComponent },
    ]
  },
];
