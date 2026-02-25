import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-mis-publicaciones',
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-publicaciones.html',
  styleUrl: './mis-publicaciones.css'
})
export class MisPublicaciones implements OnInit {
  productos: any[] = [];
  isLoading = false;
  mostrarEliminados = false; // Cambiado a false: por defecto NO mostrar eliminados

  constructor(
    private authService: AuthService,
    private productoService: ProductoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      alert('Debes iniciar sesión');
      this.router.navigate(['/login']);
      return;
    }

    if (currentUser.usuarioId) {
      this.cargarMisProductos(currentUser.usuarioId);
    }
  }

  cargarMisProductos(usuarioId: number): void {
    this.isLoading = true;
    
    // Conectar al backend
    this.productoService.obtenerProductosPorUsuario(usuarioId).subscribe({
      next: (data) => {
        this.productos = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar productos', error);
        this.isLoading = false;
        // Si hay error, mostrar mensaje
        alert('Error al cargar tus publicaciones. Verifica que el backend esté corriendo.');
      }
    });
  }

  marcarComoVendido(producto: any): void {
    if (confirm(`¿Marcar "${producto.nombre}" como vendido?`)) {
      this.productoService.marcarComoVendido(producto.id).subscribe({
        next: () => {
          producto.vendido = true;
          producto.estaActivo = false;
          alert('Producto marcado como vendido');
        },
        error: (error) => {
          console.error('Error al marcar como vendido', error);
          alert('Error al actualizar el producto');
        }
      });
    }
  }

  eliminarProducto(producto: any): void {
    if (confirm(`¿Estás seguro de eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) {
      this.productoService.eliminarProducto(producto.id).subscribe({
        next: () => {
          this.productos = this.productos.filter(p => p.id !== producto.id);
          alert('Producto eliminado');
        },
        error: (error) => {
          console.error('Error al eliminar producto', error);
          alert('Error al eliminar el producto');
        }
      });
    }
  }

  toggleMostrarEliminados(): void {
    this.mostrarEliminados = !this.mostrarEliminados;
  }

  get productosVisibles(): any[] {
    if (this.mostrarEliminados) {
      return this.productos;
    }
    return this.productos.filter(p => !p.eliminado);
  }

  get cantidadEliminados(): number {
    return this.productos.filter(p => p.eliminado).length;
  }

  getImageUrl(producto: any): string {
    if (producto.imagenPrincipal) {
      return producto.imagenPrincipal;
    }
    if (producto.imagenesUrls && producto.imagenesUrls.length > 0) {
      return producto.imagenesUrls[0];
    }
    return 'https://via.placeholder.com/300x200?text=Sin+Imagen';
  }
}