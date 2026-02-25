import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductoService } from '../../services/producto.service';
import { UsuarioService } from '../../services/usuario.service';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  estadisticas = {
    totalUsuarios: 0,
    totalProductos: 0,
    productosActivos: 0,
    productosVendidos: 0
  };

  loading = true;

  constructor(
    private authService: AuthService,
    private productoService: ProductoService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar que el usuario sea admin
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }

    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.loading = true;

    // Cargar total de usuarios
    this.usuarioService.obtenerTodos().subscribe({
      next: (usuarios: any[]) => {
        this.estadisticas.totalUsuarios = usuarios.length;
      },
      error: (error: any) => console.error('Error al cargar usuarios:', error)
    });

    // Cargar productos
    this.productoService.obtenerProductosActivos().subscribe({
      next: (productos: Producto[]) => {
        this.estadisticas.totalProductos = productos.length;
        this.estadisticas.productosActivos = productos.filter((p: Producto) => p.estaActivo && !p.vendido).length;
        this.estadisticas.productosVendidos = productos.filter((p: Producto) => p.vendido).length;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar productos:', error);
        this.loading = false;
      }
    });
  }
}
