import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, Reporte } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { ProductoService } from '../../../services/producto.service';
import { Producto } from '../../../models/producto.model';

interface ReporteAgrupado {
  productoId: number;
  productoNombre: string;
  cantidadReportes: number;
  reportes: Reporte[];
  razonesComunes: string[];
}

@Component({
  selector: 'app-reportes-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reportes-admin.html',
  styleUrl: './reportes-admin.css'
})
export class ReportesAdminComponent implements OnInit {
  reportes: Reporte[] = [];
  reportesAgrupados: ReporteAgrupado[] = [];
  isLoading = true;
  vistaSeleccionada: 'todos' | 'agrupados' = 'agrupados';
  
  // Modal
  mostrarModal = false;
  productoSeleccionado: Producto | null = null;
  imagenSeleccionada: string = '';
  cargandoProducto = false;

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

    this.cargarReportes(currentUser.usuarioId);
  }

  cargarReportes(adminId: number): void {
    this.adminService.obtenerTodosReportes(adminId).subscribe({
      next: (data) => {
        this.reportes = data;
        this.agruparReportes();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar reportes', error);
        alert('Error: ' + (error.error?.error || 'No tienes permisos de administrador'));
        this.router.navigate(['/']);
        this.isLoading = false;
      }
    });
  }

  agruparReportes(): void {
    const grupos = new Map<number, ReporteAgrupado>();

    this.reportes.forEach(reporte => {
      if (!grupos.has(reporte.productoId)) {
        grupos.set(reporte.productoId, {
          productoId: reporte.productoId,
          productoNombre: reporte.productoNombre,
          cantidadReportes: 0,
          reportes: [],
          razonesComunes: []
        });
      }

      const grupo = grupos.get(reporte.productoId)!;
      grupo.cantidadReportes++;
      grupo.reportes.push(reporte);
    });

    // Obtener razones más comunes por producto
    grupos.forEach(grupo => {
      const razones = grupo.reportes.map(r => r.razon);
      const conteoRazones = razones.reduce((acc, razon) => {
        acc[razon] = (acc[razon] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      grupo.razonesComunes = Object.entries(conteoRazones)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([razon, cantidad]) => `${razon} (${cantidad})`);
    });

    this.reportesAgrupados = Array.from(grupos.values())
      .sort((a, b) => b.cantidadReportes - a.cantidadReportes);
  }

  cambiarVista(vista: 'todos' | 'agrupados'): void {
    this.vistaSeleccionada = vista;
  }

  obtenerProductosMasReportados(): ReporteAgrupado[] {
    return this.reportesAgrupados.slice(0, 5);
  }

  // Métodos del modal
  verProducto(productoId: number): void {
    this.cargandoProducto = true;
    this.mostrarModal = true;
    
    this.productoService.obtenerProductoPorId(productoId).subscribe({
      next: (producto) => {
        this.productoSeleccionado = producto;
        this.imagenSeleccionada = this.getImageUrl(producto);
        this.cargandoProducto = false;
      },
      error: (error) => {
        console.error('Error al cargar producto', error);
        alert('Error al cargar el producto');
        this.cerrarModal();
      }
    });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.productoSeleccionado = null;
    this.imagenSeleccionada = '';
    this.cargandoProducto = false;
  }

  seleccionarImagen(url: string): void {
    this.imagenSeleccionada = url;
  }

  getImagenes(): string[] {
    if (!this.productoSeleccionado) return [];
    return this.productoSeleccionado.imagenesUrls || [];
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

  abrirWhatsApp(): void {
    if (!this.productoSeleccionado || !this.productoSeleccionado.usuarioWhatsapp) {
      alert('El vendedor no tiene WhatsApp configurado');
      return;
    }

    const mensaje = `Hola! Soy administrador de Tutodo. Me comunico respecto al producto: ${this.productoSeleccionado.nombre}`;
    const url = `https://wa.me/${this.productoSeleccionado.usuarioWhatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }
}