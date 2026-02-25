import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { Producto } from '../../../models/producto.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-productos-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './productos-admin.html',
  styleUrl: './productos-admin.css'
})
export class ProductosAdminComponent implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  isLoading = true;
  searchTerm = '';
  filtroEstado: string = 'todos'; // todos, activos, inactivos, vendidos
  
  // Paginación
  currentPage = 0;
  pageSize = 20; // 20 productos por página en admin
  totalPages = 0;
  paginatedProductos: Producto[] = [];
  Math = Math; // Para usar Math.min en el template
  
  // Modal
  mostrarModal = false;
  productoSeleccionado: Producto | null = null;
  imagenSeleccionada: string = '';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
      private toastr: ToastrService  // ← AGREGAR

  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || !currentUser.usuarioId) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarProductos(currentUser.usuarioId);
  }

  cargarProductos(adminId: number): void {
    this.adminService.obtenerTodosProductos(adminId).subscribe({
      next: (data) => {
        console.log('Productos recibidos:', data);
        console.log('Primer producto:', data[0]);
        this.productos = data;
        this.productosFiltrados = data;
        this.actualizarPaginacion();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar productos', error);
        alert('Error: ' + (error.error?.error || 'No tienes permisos de administrador'));
        this.router.navigate(['/']);
        this.isLoading = false;
      }
    });
  }

  filtrarProductos(): void {
    let resultado = this.productos;

    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      resultado = resultado.filter(producto =>
        producto.nombre.toLowerCase().includes(term) ||
        producto.descripcion.toLowerCase().includes(term) ||
        producto.categoriaNombre?.toLowerCase().includes(term)
      );
    }

    // Filtrar por estado
    if (this.filtroEstado === 'activos') {
      resultado = resultado.filter(p => p.estaActivo && !p.vendido && !p.eliminado);
    } else if (this.filtroEstado === 'inactivos') {
      resultado = resultado.filter(p => !p.estaActivo && !p.eliminado && !p.vendido);
    } else if (this.filtroEstado === 'vendidos') {
      resultado = resultado.filter(p => p.vendido);
    } else if (this.filtroEstado === 'eliminados') {
      resultado = resultado.filter(p => p.eliminado);
    }

    this.productosFiltrados = resultado;
    this.currentPage = 0; // Resetear a primera página
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    this.totalPages = Math.ceil(this.productosFiltrados.length / this.pageSize);
    const inicio = this.currentPage * this.pageSize;
    const fin = inicio + this.pageSize;
    this.paginatedProductos = this.productosFiltrados.slice(inicio, fin);
  }

  cambiarPagina(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.actualizarPaginacion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPaginaNumeros(): number[] {
    const maxPaginas = 5;
    const paginas: number[] = [];
    
    let inicio = Math.max(0, this.currentPage - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.totalPages, inicio + maxPaginas);
    
    if (fin - inicio < maxPaginas) {
      inicio = Math.max(0, fin - maxPaginas);
    }
    
    for (let i = inicio; i < fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  reactivarProducto(producto: any): void {
    if (!confirm(`¿Reactivar el producto "${producto.nombre}"?`)) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.usuarioId) return;

    this.adminService.reactivarProducto(producto.id, currentUser.usuarioId).subscribe({
      next: () => {
        this.toastr.success('Producto reactivado exitosamente', 'Éxito');
        producto.estaActivo = true;
        this.filtrarProductos();
      },
      error: (error) => {
        console.error('Error al reactivar producto', error);
        this.toastr.error(error.error?.error || 'Error al reactivar el producto', 'Error');
      }
    });
  }

  inhabilitarProducto(producto: Producto): void {
    if (!confirm(`¿Inhabilitar la publicación "${producto.nombre}"?\n\nEl producto dejará de ser visible para los usuarios.`)) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.usuarioId) return;

    this.adminService.inhabilitarProducto(producto.id, currentUser.usuarioId).subscribe({
      next: () => {
        this.toastr.success('Producto inhabilitado exitosamente', 'Éxito');
        producto.estaActivo = false;
        this.filtrarProductos();
      },
      error: (error) => {
        console.error('Error al inhabilitar producto', error);
        this.toastr.error(error.error?.error || 'Error al inhabilitar el producto', 'Error');
      }
    });
  }

  eliminarProducto(producto: Producto): void {
    if (!confirm(`¿Eliminar permanentemente "${producto.nombre}"?`)) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.usuarioId) return;

    this.adminService.eliminarProducto(producto.id, currentUser.usuarioId).subscribe({
      next: () => {
        this.toastr.success('Producto eliminado', 'Éxito');
        producto.eliminado = true;
        this.filtrarProductos();
      },
      error: (error) => {
        console.error('Error al eliminar producto', error);
        this.toastr.error('Error al eliminar el producto', 'Error');
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
    return 'https://via.placeholder.com/100x100?text=Sin+Imagen';
  }

  contarActivos(): number {
    return this.productos.filter(p => p.estaActivo && !p.vendido && !p.eliminado).length;
  }

  contarInactivos(): number {
    return this.productos.filter(p => !p.estaActivo && !p.vendido && !p.eliminado).length;
  }

  contarVendidos(): number {
    return this.productos.filter(p => p.vendido).length;
  }

  contarEliminados(): number {
    return this.productos.filter(p => p.eliminado).length;
  }

  // Métodos del modal
  verProducto(producto: Producto): void {
    this.productoSeleccionado = producto;
    // Asegurarse de que la imagen se cargue correctamente
    if (producto.imagenPrincipal) {
      this.imagenSeleccionada = producto.imagenPrincipal;
    } else if (producto.imagenesUrls && producto.imagenesUrls.length > 0) {
      this.imagenSeleccionada = producto.imagenesUrls[0];
    } else {
      this.imagenSeleccionada = 'https://via.placeholder.com/400x300?text=Sin+Imagen';
    }
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.productoSeleccionado = null;
    this.imagenSeleccionada = '';
  }

  seleccionarImagen(url: string): void {
    this.imagenSeleccionada = url;
  }

  getImagenes(): string[] {
    if (!this.productoSeleccionado) return [];
    
    // Si tiene imagenesUrls, usarlas
    if (this.productoSeleccionado.imagenesUrls && this.productoSeleccionado.imagenesUrls.length > 0) {
      return this.productoSeleccionado.imagenesUrls;
    }
    
    // Si solo tiene imagenPrincipal, retornar array con esa imagen
    if (this.productoSeleccionado.imagenPrincipal) {
      return [this.productoSeleccionado.imagenPrincipal];
    }
    
    return [];
  }
}