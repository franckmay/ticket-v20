import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectVueComponent } from './project-vue.component';

describe('ProjectVueComponent', () => {
  let component: ProjectVueComponent;
  let fixture: ComponentFixture<ProjectVueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [ProjectVueComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(ProjectVueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
