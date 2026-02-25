import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminService, Estadisticas } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  estadisticas: Estadisticas | null = null;
  isLoading = true;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || !currentUser.usuarioId) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarEstadisticas(currentUser.usuarioId);
  }

  cargarEstadisticas(adminId: number): void {
    this.adminService.obtenerEstadisticas(adminId).subscribe({
      next: (data) => {
        this.estadisticas = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas', error);
        alert('Error: ' + (error.error?.error || 'No tienes permisos de administrador'));
        this.router.navigate(['/']);
        this.isLoading = false;
      }
    });
  }
}