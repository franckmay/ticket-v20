import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjetetDetailComponent } from './projetet-detail.component';

describe('ProjetetDetailComponent', () => {
  let component: ProjetetDetailComponent;
  let fixture: ComponentFixture<ProjetetDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ProjetetDetailComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(ProjetetDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
