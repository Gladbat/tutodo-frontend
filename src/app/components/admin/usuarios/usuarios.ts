import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { ProductoService } from '../../../services/producto.service';
import { Usuario, Rol } from '../../../models/usuario.model';
import { Producto } from '../../../models/producto.model';
import { WhatsappFormatPipe } from '../../../pipes/whatsapp-format.pipe';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, WhatsappFormatPipe],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  isLoading = true;
  searchTerm = '';
  filtroEstado: 'todos' | 'activos' | 'suspendidos' | 'eliminados' = 'activos';
  
  // Modal de productos
  mostrarModalProductos = false;
  usuarioSeleccionado: Usuario | null = null;
  productosUsuario: Producto[] = [];
  cargandoProductos = false;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private productoService: ProductoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || !currentUser.usuarioId) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarUsuarios(currentUser.usuarioId);
  }

  cargarUsuarios(adminId: number): void {
    this.adminService.obtenerTodosUsuarios(adminId).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.filtrarUsuarios(); // Aplicar filtro inicial
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios', error);
        alert('Error: ' + (error.error?.error || 'No tienes permisos de administrador'));
        this.router.navigate(['/']);
        this.isLoading = false;
      }
    });
  }

  filtrarUsuarios(): void {
    let usuariosFiltrados = this.usuarios;

    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.nombre.toLowerCase().includes(term) ||
        usuario.apellido.toLowerCase().includes(term) ||
        usuario.email.toLowerCase().includes(term) ||
        usuario.numeroWhatsapp.includes(term)
      );
    }

    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      usuariosFiltrados = usuariosFiltrados.filter(usuario => {
        switch (this.filtroEstado) {
          case 'activos':
            return !usuario.suspendido && !usuario.eliminado;
          case 'suspendidos':
            return usuario.suspendido && !usuario.eliminado;
          case 'eliminados':
            return usuario.eliminado;
          default:
            return true;
        }
      });
    }

    this.usuariosFiltrados = usuariosFiltrados;
  }

  cambiarFiltroEstado(estado: 'todos' | 'activos' | 'suspendidos' | 'eliminados'): void {
    this.filtroEstado = estado;
    this.filtrarUsuarios();
  }

  contarPorEstado(estado: 'activos' | 'suspendidos' | 'eliminados'): number {
    switch (estado) {
      case 'activos':
        return this.usuarios.filter(u => !u.suspendido && !u.eliminado).length;
      case 'suspendidos':
        return this.usuarios.filter(u => u.suspendido && !u.eliminado).length;
      case 'eliminados':
        return this.usuarios.filter(u => u.eliminado).length;
      default:
        return 0;
    }
  }

  esAdmin(usuario: Usuario): boolean {
    return usuario.rol === Rol.ADMIN;
  }

  esMiCuenta(usuario: Usuario): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.usuarioId === usuario.id;
  }

  getRolBadgeClass(rol: Rol): string {
    return rol === Rol.ADMIN ? 'bg-danger' : 'bg-primary';
  }

  suspenderUsuario(usuario: Usuario): void {
    if (!confirm(`¿Suspender al usuario "${usuario.nombre} ${usuario.apellido}"?`)) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.usuarioId) return;

    this.adminService.suspenderUsuario(usuario.id, currentUser.usuarioId).subscribe({
      next: () => {
        alert('Usuario suspendido exitosamente');
        usuario.suspendido = true;
      },
      error: (error) => {
        console.error('Error al suspender usuario', error);
        alert(error.error?.error || 'Error al suspender el usuario');
      }
    });
  }

  reactivarUsuario(usuario: Usuario): void {
    if (!confirm(`¿Reactivar al usuario "${usuario.nombre} ${usuario.apellido}"?`)) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.usuarioId) return;

    this.adminService.reactivarUsuario(usuario.id, currentUser.usuarioId).subscribe({
      next: () => {
        alert('Usuario reactivado exitosamente');
        usuario.suspendido = false;
      },
      error: (error) => {
        console.error('Error al reactivar usuario', error);
        alert(error.error?.error || 'Error al reactivar el usuario');
      }
    });
  }

  eliminarUsuario(usuario: Usuario): void {
    if (!confirm(`¿ELIMINAR PERMANENTEMENTE al usuario "${usuario.nombre} ${usuario.apellido}"?\n\nEsta acción no se puede deshacer.\nSus productos serán eliminados.`)) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.usuarioId) return;

    this.adminService.eliminarUsuario(usuario.id, currentUser.usuarioId).subscribe({
      next: () => {
        alert('Usuario eliminado exitosamente');
        // Marcar como eliminado en lugar de quitar de la lista
        usuario.eliminado = true;
        this.filtrarUsuarios();
      },
      error: (error) => {
        console.error('Error al eliminar usuario', error);
        alert(error.error?.error || 'Error al eliminar el usuario');
      }
    });
  }

  verProductosUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.mostrarModalProductos = true;
    this.cargandoProductos = true;

    this.productoService.obtenerProductosPorUsuario(usuario.id).subscribe({
      next: (productos) => {
        this.productosUsuario = productos;
        this.cargandoProductos = false;
      },
      error: (error) => {
        console.error('Error al cargar productos', error);
        alert('Error al cargar los productos del usuario');
        this.cerrarModalProductos();
      }
    });
  }

  cerrarModalProductos(): void {
    this.mostrarModalProductos = false;
    this.usuarioSeleccionado = null;
    this.productosUsuario = [];
    this.cargandoProductos = false;
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
}