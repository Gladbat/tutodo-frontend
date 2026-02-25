import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReporteService, ReporteDTO } from '../../services/reporte.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mis-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-reportes.html',
  styleUrl: './mis-reportes.css'
})
export class MisReportesComponent implements OnInit {
  reportes: ReporteDTO[] = [];
  isLoading = true;

  constructor(
    private reporteService: ReporteService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || !currentUser.usuarioId) {
      alert('Debes iniciar sesión');
      this.router.navigate(['/login']);
      return;
    }

    this.cargarMisReportes(currentUser.usuarioId);
  }

  cargarMisReportes(usuarioId: number): void {
    this.reporteService.obtenerMisReportes(usuarioId).subscribe({
      next: (data) => {
        this.reportes = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar reportes', error);
        this.isLoading = false;
      }
    });
  }

  getRazonBadgeClass(razon: string): string {
    if (razon.includes('Precio')) return 'bg-warning';
    if (razon.includes('imágenes')) return 'bg-danger';
    if (razon.includes('estafa')) return 'bg-dark';
    if (razon.includes('Contenido')) return 'bg-danger';
    return 'bg-secondary';
  }
}