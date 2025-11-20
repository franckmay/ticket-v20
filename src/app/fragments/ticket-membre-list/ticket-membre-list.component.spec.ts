import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketMembreListComponent } from './ticket-membre-list.component';

describe('TicketMembreListComponent', () => {
  let component: TicketMembreListComponent;
  let fixture: ComponentFixture<TicketMembreListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [TicketMembreListComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(TicketMembreListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
