import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BusquedaCercanaService, BusquedaCercanaResponse } from '../../services/busqueda-cercana.service';
import { CategoriaService } from '../../services/categoria.service';
import { Producto } from '../../models/producto.model';
import { Categoria } from '../../models/categoria.model';
import { ToastrService } from 'ngx-toastr';
import * as L from 'leaflet';

@Component({
  selector: 'app-busqueda-cercana',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './busqueda-cercana.html',
  styleUrl: './busqueda-cercana.css'
})
export class BusquedaCercanaComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  map!: L.Map;
  userMarker!: L.Marker;
  radiusCircle!: L.Circle;
  productMarkers: L.Marker[] = [];

  productos: Producto[] = [];
  categorias: Categoria[] = [];
  categoriaSeleccionada: number | null = null;
  productoSeleccionado: Producto | null = null;

  // Ubicación del usuario
  miUbicacion = { lat: -8.1116, lng: -79.0288 }; // Trujillo por defecto
  ubicacionObtenida = false;

  // Radio de búsqueda en km
  radioKm = 2;
  radioOptions = [
    { value: 0.5, label: '500 metros' },
    { value: 1, label: '1 km' },
    { value: 2, label: '2 km' },
    { value: 3, label: '3 km' },
    { value: 5, label: '5 km' }
  ];

  isLoading = false;
  buscandoUbicacion = false;

  constructor(
    private busquedaCercanaService: BusquedaCercanaService,
    private categoriaService: CategoriaService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  ngAfterViewInit(): void {
    this.inicializarMapa();
    this.obtenerMiUbicacion();
  }

  cargarCategorias(): void {
    this.categoriaService.obtenerTodasCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (error) => {
        console.error('Error al cargar categorías', error);
      }
    });
  }

  inicializarMapa(): void {
    // Crear mapa centrado en Trujillo
    this.map = L.map(this.mapContainer.nativeElement).setView(
      [this.miUbicacion.lat, this.miUbicacion.lng],
      13
    );

    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Marcador del usuario
    const userIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.userMarker = L.marker([this.miUbicacion.lat, this.miUbicacion.lng], {
      icon: userIcon,
      draggable: true
    }).addTo(this.map);

    this.userMarker.bindPopup('Tu ubicación (arrastra para mover)').openPopup();

    // Círculo de radio
    this.radiusCircle = L.circle([this.miUbicacion.lat, this.miUbicacion.lng], {
      radius: this.radioKm * 1000,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 2
    }).addTo(this.map);

    // Listener para drag del marcador
    this.userMarker.on('dragend', () => {
      const position = this.userMarker.getLatLng();
      this.miUbicacion = { lat: position.lat, lng: position.lng };
      this.radiusCircle.setLatLng(position);
      this.toastr.info('Ubicación actualizada', 'Nueva búsqueda disponible');
    });
  }

  obtenerMiUbicacion(): void {
    if (!navigator.geolocation) {
      this.toastr.warning('Tu navegador no soporta geolocalización', 'Aviso');
      return;
    }

    this.buscandoUbicacion = true;
    this.toastr.info('Obteniendo tu ubicación...', 'GPS');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.miUbicacion = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        this.ubicacionObtenida = true;
        this.buscandoUbicacion = false;

        // Actualizar mapa
        this.map.setView([this.miUbicacion.lat, this.miUbicacion.lng], 15);
        this.userMarker.setLatLng([this.miUbicacion.lat, this.miUbicacion.lng]);
        this.radiusCircle.setLatLng([this.miUbicacion.lat, this.miUbicacion.lng]);

        this.toastr.success('Ubicación obtenida', '¡Listo!');
      },
      (error) => {
        console.error('Error obteniendo ubicación', error);
        this.buscandoUbicacion = false;
        this.toastr.warning('No se pudo obtener tu ubicación. Usando Trujillo por defecto.', 'Aviso');
      }
    );
  }

  cambiarRadio(): void {
    this.radiusCircle.setRadius(this.radioKm * 1000);
    
    // Ajustar zoom según el radio
    let zoom = 13;
    if (this.radioKm <= 1) zoom = 15;
    else if (this.radioKm <= 2) zoom = 14;
    else if (this.radioKm <= 3) zoom = 13;
    else zoom = 12;
    
    this.map.setZoom(zoom);
  }

  buscarCercanos(): void {
    this.isLoading = true;
    this.limpiarMarcadores();

    this.busquedaCercanaService.buscarCercanos(
      this.miUbicacion.lat,
      this.miUbicacion.lng,
      this.radioKm,
      this.categoriaSeleccionada || undefined
    ).subscribe({
      next: (response: BusquedaCercanaResponse) => {
        this.productos = response.productos;
        this.isLoading = false;

        if (this.productos.length === 0) {
          this.toastr.info('No se encontraron productos en esta área', 'Sin resultados');
        } else {
          this.toastr.success(
            `${this.productos.length} producto(s) encontrado(s)`,
            '¡Búsqueda completa!'
          );
          this.agregarMarcadoresProductos();
        }
      },
      error: (error: any) => {
        console.error('Error al buscar', error);
        this.toastr.error('Error al buscar productos cercanos', 'Error');
        this.isLoading = false;
      }
    });
  }

  agregarMarcadoresProductos(): void {
    const productIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.productos.forEach(producto => {
      if (producto.latitud && producto.longitud) {
        const marker = L.marker([producto.latitud, producto.longitud], {
          icon: productIcon
        }).addTo(this.map);

        const distancia = this.getDistancia(producto);

        marker.bindPopup(`
          <div style="min-width: 200px;">
            <img src="${this.getImageUrl(producto)}" 
                 style="width: 100%; border-radius: 8px; margin-bottom: 8px;"
                 onerror="this.src='https://via.placeholder.com/200x150?text=Sin+Imagen'">
            <h6 style="margin: 0 0 5px 0; font-weight: bold;">${producto.nombre}</h6>
            <p style="margin: 0 0 5px 0; color: #2563eb; font-weight: bold;">S/ ${producto.precio}</p>
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
              <i class="bi bi-geo-alt"></i> ${distancia}
            </p>
            <a href="/productos/${producto.id}" style="display: block; margin-top: 8px; color: #2563eb; text-decoration: none;">
              Ver detalles →
            </a>
          </div>
        `);

        this.productMarkers.push(marker);
      }
    });
  }

  limpiarMarcadores(): void {
    this.productMarkers.forEach(marker => this.map.removeLayer(marker));
    this.productMarkers = [];
  }

  getImageUrl(producto: Producto): string {
    return producto.imagenPrincipal || 
           (producto.imagenesUrls && producto.imagenesUrls[0]) || 
           'https://via.placeholder.com/100x100?text=Sin+Imagen';
  }

  getDistancia(producto: Producto): string {
    if (!producto.latitud || !producto.longitud) return '-';
    
    const distancia = this.busquedaCercanaService.calcularDistancia(
      this.miUbicacion.lat,
      this.miUbicacion.lng,
      producto.latitud,
      producto.longitud
    );
    
    return distancia < 1 
      ? `${Math.round(distancia * 1000)}m` 
      : `${distancia.toFixed(1)}km`;
  }

  verEnMapa(producto: Producto): void {
    if (!producto.latitud || !producto.longitud) return;
    
    this.map.setView([producto.latitud, producto.longitud], 17);
    
    // Encontrar y abrir el popup del marcador
    const marker = this.productMarkers.find(m => {
      const pos = m.getLatLng();
      return pos.lat === producto.latitud && pos.lng === producto.longitud;
    });
    
    if (marker) {
      marker.openPopup();
    }
  }

  verDetalles(producto: Producto): void {
    this.productoSeleccionado = producto;
    
    // Abrir modal usando Bootstrap
    const modalElement = document.getElementById('productoModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  getWhatsAppLink(producto: Producto): string {
    const mensaje = `Hola, estoy interesado en tu producto: ${producto.nombre} - S/ ${producto.precio}`;
    const numeroWhatsapp = producto.usuarioWhatsapp || '';
    return `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensaje)}`;
  }
}