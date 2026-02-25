import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisReportes } from './mis-reportes';

describe('MisReportes', () => {
  let component: MisReportes;
  let fixture: ComponentFixture<MisReportes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisReportes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisReportes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
