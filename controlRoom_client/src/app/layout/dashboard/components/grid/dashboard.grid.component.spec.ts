import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardGridComponent } from './dashboard.grid.component';

describe('NotificationComponent', () => {
  let component: DashboardGridComponent;
  let fixture: ComponentFixture<DashboardGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
