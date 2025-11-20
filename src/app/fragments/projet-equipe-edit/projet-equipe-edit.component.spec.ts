import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjetEquipeEditComponent } from './projet-equipe-edit.component';

describe('ProjetEquipeEditComponent', () => {
  let component: ProjetEquipeEditComponent;
  let fixture: ComponentFixture<ProjetEquipeEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [ProjetEquipeEditComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(ProjetEquipeEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
