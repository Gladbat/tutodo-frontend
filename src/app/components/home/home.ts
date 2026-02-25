import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  productosRecientes: Producto[] = [];
  isLoading = true;

  constructor(
    public authService: AuthService,
    private productoService: ProductoService
  ) {}

  ngOnInit() {
    this.cargarProductosRecientes();
  }

  cargarProductosRecientes(): void {
    this.productoService.obtenerProductosActivos().subscribe({
      next: (productos) => {
        // Tomar solo los últimos 6 productos
        this.productosRecientes = productos.slice(0, 6);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar productos', error);
        this.isLoading = false;
      }
    });
  }

  getImageUrl(producto: Producto): string {
    if (producto.imagenPrincipal) {
      return producto.imagenPrincipal;
    }
    if (producto.imagenesUrls && producto.imagenesUrls.length > 0) {
      return producto.imagenesUrls[0];
    }
    return 'https://via.placeholder.com/400x300?text=Sin+Imagen';
  }
}