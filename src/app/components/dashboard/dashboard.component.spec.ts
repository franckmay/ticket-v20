import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { ProjetService } from '../../services/projet.service';
import { TicketService } from '../../services/ticket.service';
import { SprintService } from '../../services/sprint.service';
import { SessionStorageService } from '../../services/session/session-storage.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  // 1. Création des Mocks (Simulations des services)
  const mockProjetService = {
    list: jasmine.createSpy('list').and.returnValue(of([])),
    delete: jasmine.createSpy('delete').and.returnValue(of({}))
  };

  const mockTicketService = {
    list: jasmine.createSpy('list').and.returnValue(of([])),
    delete: jasmine.createSpy('delete').and.returnValue(of({}))
  };

  const mockSprintService = {
    list: jasmine.createSpy('list').and.returnValue(of([]))
  };

  const mockSessionService = {
    getUser: jasmine.createSpy('getUser').and.returnValue({ login: 'testUser', organisationID: 'org1' }),
    getOrganisation: jasmine.createSpy('getOrganisation').and.returnValue('org1')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent, // Composant Standalone importé ici
        TranslateModule.forRoot(), // Pour gérer les pipes | translate
        NoopAnimationsModule // Désactive les animations PrimeNG pour les tests
      ],
      providers: [
        // Injection des Mocks à la place des vrais services
        { provide: ProjetService, useValue: mockProjetService },
        { provide: TicketService, useValue: mockTicketService },
        { provide: SprintService, useValue: mockSprintService },
        { provide: SessionStorageService, useValue: mockSessionService },
        // Services PrimeNG
        ConfirmationService,
        MessageService,
        // Mock ActivatedRoute si nécessaire pour le routing
        {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Déclenche ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load projects on init', () => {
    expect(mockSessionService.getUser).toHaveBeenCalled();
    expect(mockProjetService.list).toHaveBeenCalled();
  });
});