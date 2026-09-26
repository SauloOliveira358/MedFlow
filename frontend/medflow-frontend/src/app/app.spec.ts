import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('O cuidado começa');
  });
  it('abre a demonstração e navega até pacientes', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.demo();
    fixture.componentInstance.go('Pacientes');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Mariana Costa');
  });
});
