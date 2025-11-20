import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketMembreEditComponent } from './ticket-membre-edit.component';

describe('TicketMembreEditComponent', () => {
  let component: TicketMembreEditComponent;
  let fixture: ComponentFixture<TicketMembreEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [TicketMembreEditComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(TicketMembreEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
