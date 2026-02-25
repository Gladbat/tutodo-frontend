import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisPublicaciones } from './mis-publicaciones';

describe('MisPublicaciones', () => {
  let component: MisPublicaciones;
  let fixture: ComponentFixture<MisPublicaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisPublicaciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisPublicaciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
