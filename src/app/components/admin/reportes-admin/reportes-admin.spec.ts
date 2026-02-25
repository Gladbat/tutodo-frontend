import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesAdmin } from './reportes-admin';

describe('ReportesAdmin', () => {
  let component: ReportesAdmin;
  let fixture: ComponentFixture<ReportesAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
