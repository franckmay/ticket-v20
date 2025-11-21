import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';

// Imports réels (utilisés pour le token d'injection)
import { SessionStorageService } from '../../services/session/session-storage.service';
import { AuthService } from '../../services/auth/_services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let sessionStorageMock: any;

  beforeEach(async () => {
    // Mocks
    authServiceMock = {
      login: jasmine.createSpy('login').and.returnValue(of({ user: { id: 1 }, otpCode: '123456' })),
      confirmCode: jasmine.createSpy('confirmCode').and.returnValue(of({ token: 'fake-token', utilisateur: { organisationID: 1 } })),
      sendCode: jasmine.createSpy('sendCode').and.returnValue(of({}))
    };

    sessionStorageMock = {
      saveRole: jasmine.createSpy('saveRole'),
      saveOrganisation: jasmine.createSpy('saveOrganisation'),
      saveUser: jasmine.createSpy('saveUser')
    };

    await TestBed.configureTestingModule({
      imports: [ 
        LoginComponent, 
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        FormsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: SessionStorageService, useValue: sessionStorageMock },
        TranslateService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle login error correctly', () => {
    authServiceMock.login.and.returnValue(throwError(() => ({ status: 401, statusText: 'Unauthorized' })));
    
    component.form.username = 'wrong';
    component.form.password = 'wrong';
    component.onSubmit();

    expect(component.isLoginFailed).toBeTrue();
    expect(component.loading).toBeFalse(); // Le test confirme que le bouton est débloqué
  });
});