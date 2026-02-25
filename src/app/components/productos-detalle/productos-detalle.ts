import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProductoService } from '../../services/producto.service';
import { FavoritoService } from '../../services/favorito.service';
import { ReporteService } from '../../services/reporte.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './productos-detalle.html',
  styleUrl: './productos-detalle.css'
})
export class ProductosDetalle implements OnInit, AfterViewInit {

  producto: any | null = null;
  imagenSeleccionada: string = '';
  isLoading = true;
  esFavorito = false;
  yaReportado = false; // Nuevo: para saber si ya reportó este producto

  // Reporte
  mostrarModalReporte = false;
  razonSeleccionada = '';
  comentarioReporte = '';
  enviandoReporte = false;

  // =============================
  // MAPA UBICACIÓN (LEAFLET)
  // =============================
  @ViewChild('mapaUbicacion', { static: false }) mapaUbicacion!: ElementRef;

  mapaProducto!: L.Map;
  readonly RADIO_PRIVACIDAD = 60;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private productoService: ProductoService,
    private favoritoService: FavoritoService,
    public reporteService: ReporteService
  ) {}

  // =============================
  // INIT
  // =============================
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarProducto(Number(id));
    }
  }

  ngAfterViewInit(): void {
    if (this.producto?.latitud && this.producto?.longitud) {
      setTimeout(() => {
        this.inicializarMapaProducto();
      }, 500);
    }
  }

  // =============================
  // CARGAR PRODUCTO
  // =============================
  cargarProducto(id: number): void {
    this.isLoading = true;

    this.productoService.obtenerProductoPorId(id).subscribe({
      next: (producto) => {
        this.producto = producto;
        this.imagenSeleccionada = this.getImagenPrincipal();
        this.isLoading = false;

        this.verificarSiEsFavorito(id);
        this.verificarSiYaReporto(id); // Nuevo: verificar si ya reportó

        if (this.producto?.latitud && this.producto?.longitud) {
          setTimeout(() => {
            this.inicializarMapaProducto();
          }, 500);
        }
      },
      error: (error) => {
        console.error('Error al cargar producto', error);
        this.isLoading = false;
        alert('Producto no encontrado');
        this.router.navigate(['/productos']);
      }
    });
  }

  // =============================
  // FAVORITOS
  // =============================
  verificarSiEsFavorito(productoId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.usuarioId) return;

    this.favoritoService.esFavorito(currentUser.usuarioId, productoId).subscribe({
      next: (response) => {
        this.esFavorito = response.esFavorito;
      }
    });
  }

  verificarSiYaReporto(productoId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.usuarioId) return;

    this.reporteService.verificarReporte(productoId, currentUser.usuarioId).subscribe({
      next: (response) => {
        this.yaReportado = response.yaReporto;
      },
      error: (error) => {
        console.error('Error al verificar reporte', error);
      }
    });
  }

  toggleFavorito(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser?.usuarioId) {
      alert('Debes iniciar sesión');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.producto) return;

    if (this.esFavorito) {
      this.favoritoService.quitarFavorito(currentUser.usuarioId, this.producto.id)
        .subscribe(() => this.esFavorito = false);
    } else {
      this.favoritoService.agregarFavorito({
        usuarioId: currentUser.usuarioId,
        productoId: this.producto.id
      }).subscribe(() => this.esFavorito = true);
    }
  }

  // =============================
  // IMÁGENES
  // =============================
  seleccionarImagen(url: string): void {
    this.imagenSeleccionada = url;
  }

  getImagenPrincipal(): string {
    if (!this.producto) return 'https://via.placeholder.com/600x400?text=Sin+Imagen';

    // Prioridad: imagenPrincipal > primera de imagenesUrls > placeholder
    if (this.producto.imagenPrincipal) {
      return this.producto.imagenPrincipal;
    }
    
    if (this.producto.imagenesUrls && this.producto.imagenesUrls.length > 0) {
      return this.producto.imagenesUrls[0];
    }

    return 'https://via.placeholder.com/600x400?text=Sin+Imagen';
  }

  getImagenes(): string[] {
    if (!this.producto) return [];
    
    // Si tiene imagenesUrls, usarlas
    if (this.producto.imagenesUrls && this.producto.imagenesUrls.length > 0) {
      return this.producto.imagenesUrls;
    }
    
    // Si solo tiene imagenPrincipal, retornar array con esa imagen
    if (this.producto.imagenPrincipal) {
      return [this.producto.imagenPrincipal];
    }
    
    return [];
  }

  // Navegación de imágenes
  imagenAnterior(): void {
    const imagenes = this.getImagenes();
    if (imagenes.length <= 1) return;
    
    const currentIndex = imagenes.indexOf(this.imagenSeleccionada);
    const newIndex = currentIndex === 0 ? imagenes.length - 1 : currentIndex - 1;
    this.imagenSeleccionada = imagenes[newIndex];
  }

  imagenSiguiente(): void {
    const imagenes = this.getImagenes();
    if (imagenes.length <= 1) return;
    
    const currentIndex = imagenes.indexOf(this.imagenSeleccionada);
    const newIndex = currentIndex === imagenes.length - 1 ? 0 : currentIndex + 1;
    this.imagenSeleccionada = imagenes[newIndex];
  }

  getImagenIndex(): string {
    const imagenes = this.getImagenes();
    if (imagenes.length <= 1) return '';
    
    const currentIndex = imagenes.indexOf(this.imagenSeleccionada);
    return `${currentIndex + 1} / ${imagenes.length}`;
  }

  // =============================
  // WHATSAPP
  // =============================
  abrirWhatsApp(): void {
    if (!this.producto?.usuarioWhatsapp) {
      alert('El vendedor no tiene WhatsApp');
      return;
    }

    const mensaje = `Hola! Me interesa tu producto: ${this.producto.nombre}`;
    const url = `https://wa.me/${this.producto.usuarioWhatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank');
  }

  // =============================
  // MAPA PRODUCTO (LEAFLET)
  // =============================
  inicializarMapaProducto(): void {
    if (!this.producto?.latitud || !this.producto?.longitud) return;

    if (!this.mapaUbicacion) return;

    const center: L.LatLngExpression = [
      this.producto.latitud,
      this.producto.longitud
    ];

    this.mapaProducto = L.map(this.mapaUbicacion.nativeElement, {
      center: center,
      zoom: 17, // Aumentado para ver mejor el círculo de 50m
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapaProducto);

    // Círculo de privacidad (50 metros)
    L.circle(center, {
      radius: this.RADIO_PRIVACIDAD,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.3,
      weight: 3,
      opacity: 0.8
    }).addTo(this.mapaProducto);

    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.marker(center, { icon: customIcon })
      .addTo(this.mapaProducto)
      .bindPopup('Ubicación aproximada del producto');

    // Forzar recalculo del tamaño del mapa
    setTimeout(() => {
      this.mapaProducto.invalidateSize();
    }, 100);
  }

  tieneUbicacion(): boolean {
    return !!(this.producto?.latitud && this.producto?.longitud);
  }

  // =============================
  // PERMISOS
  // =============================
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  esPropio(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return !!(
      currentUser &&
      this.producto &&
      currentUser.usuarioId === this.producto.usuarioId
    );
  }

  esAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // =============================
  // REPORTE
  // =============================
  abrirModalReporte(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      alert('Debes iniciar sesión');
      this.router.navigate(['/login']);
      return;
    }

    if (this.esPropio()) {
      alert('No puedes reportar tu propio producto');
      return;
    }

    this.mostrarModalReporte = true;
  }

  cerrarModalReporte(): void {
    this.mostrarModalReporte = false;
    this.razonSeleccionada = '';
    this.comentarioReporte = '';
  }

  enviarReporte(): void {
    if (!this.razonSeleccionada) {
      alert('Selecciona una razón');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.usuarioId) return;

    this.enviandoReporte = true;

    this.reporteService.crearReporte({
      productoId: this.producto.id,
      usuarioReportadorId: currentUser.usuarioId,
      razon: this.razonSeleccionada,
      comentario: this.comentarioReporte || undefined
    }).subscribe({
      next: () => {
        alert('Reporte enviado correctamente');
        this.yaReportado = true; // Actualizar estado
        this.cerrarModalReporte();
        this.enviandoReporte = false;
      },
      error: () => {
        alert('Error al enviar reporte');
        this.enviandoReporte = false;
      }
    });
  }
}