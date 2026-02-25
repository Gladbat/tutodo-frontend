import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { ImagenService } from '../../services/imagen.service';
import { ProductoCreateRequest } from '../../models/producto.model';
import { Categoria } from '../../models/categoria.model';
import { ToastrService } from 'ngx-toastr';
import * as L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

@Component({
  selector: 'app-publicar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publicar-producto.html',
  styleUrl: './publicar-producto.css'
})
export class PublicarProductoComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  producto: ProductoCreateRequest = {
    nombre: '',
    descripcion: '',
    precio: 0,
    estado: 'nuevo',
    categoriaId: 0,
    direccion: '',
    atributosExtra: '',
    usuarioId: 0
  };

  categorias: Categoria[] = [];
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  maxImages = 8;
  errorMessage = '';
  isLoading = false;

  // Leaflet Map
  map!: L.Map;
  marker!: L.Marker;
  areaCircle!: L.Circle;
  mostrarMapa = false;
  ubicacionSeleccionada = false;
  
  // Búsqueda de direcciones
  direccionBusqueda = '';
  sugerenciasDirecciones: any[] = [];
  buscandoDireccion = false;
  
  readonly RADIO_PRIVACIDAD = 100;

  // Límites de Perú (bounding box)
  readonly PERU_BOUNDS: L.LatLngBoundsExpression = [
    [-18.4, -81.4], // Suroeste
    [-0.0, -68.7]   // Noreste
  ] as L.LatLngBoundsExpression;

  // Centro de Perú (aproximado)
  readonly PERU_CENTER: L.LatLngExpression = [-9.19, -75.0152];

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private authService: AuthService,
    private imagenService: ImagenService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.toastr.warning('Debes iniciar sesión para publicar', 'Acción requerida');
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.usuarioId) {
      this.producto.usuarioId = currentUser.usuarioId;
    }

    this.cargarCategorias();
  }

  ngAfterViewInit(): void {}

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

  toggleMapa(): void {
    this.mostrarMapa = !this.mostrarMapa;
    
    if (this.mostrarMapa && !this.map) {
      setTimeout(() => {
        this.inicializarMapa();
      }, 100);
    }
  }

  inicializarMapa(): void {
    // Crear mapa centrado en Perú con límites
    this.map = L.map(this.mapContainer.nativeElement, {
      center: this.PERU_CENTER,
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      maxBounds: this.PERU_BOUNDS,
      maxBoundsViscosity: 1.0
    });

    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Configurar provider de búsqueda limitado a Perú
    const provider = new OpenStreetMapProvider({
      params: {
        countrycodes: 'pe', // Solo resultados de Perú
        'accept-language': 'es',
        addressdetails: 1
      }
    });

    // Agregar control de búsqueda
    const searchControl = new (GeoSearchControl as any)({
      provider: provider,
      style: 'bar',
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Buscar dirección en Perú...'
    });

    this.map.addControl(searchControl);

    // Evento cuando se selecciona un resultado de búsqueda
    this.map.on('geosearch/showlocation', (result: any) => {
      const { x, y } = result.location;
      this.colocarMarcador(y, x);
      this.map.setView([y, x], 17);
    });

    // Click en el mapa para colocar pin
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      // Verificar que esté dentro de Perú
      if (this.estaEnPeru(e.latlng.lat, e.latlng.lng)) {
        this.colocarMarcador(e.latlng.lat, e.latlng.lng);
      } else {
        this.toastr.warning('Solo puedes seleccionar ubicaciones en Perú', 'Ubicación inválida');
      }
    });

    // Obtener ubicación actual automáticamente
    this.obtenerUbicacionActual();
  }

  estaEnPeru(lat: number, lng: number): boolean {
    // Verificar si las coordenadas están dentro de los límites de Perú
    const bounds = L.latLngBounds([
      [-18.4, -81.4], // Suroeste
      [-0.0, -68.7]   // Noreste
    ]);
    return bounds.contains(L.latLng(lat, lng));
  }

  obtenerUbicacionActual(): void {
    if (!navigator.geolocation) {
      this.toastr.info('Tu navegador no soporta geolocalización', 'Información');
      return;
    }

    this.toastr.info('Obteniendo tu ubicación...', 'Por favor espera');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Verificar que esté en Perú
        if (this.estaEnPeru(lat, lng)) {
          this.colocarMarcador(lat, lng);
          this.map.setView([lat, lng], 15);
          this.toastr.success('Ubicación obtenida', 'Éxito');
        } else {
          this.toastr.warning('Tu ubicación actual está fuera de Perú. Por favor selecciona una ubicación manualmente.', 'Fuera de Perú');
          this.map.setView(this.PERU_CENTER, 6);
        }
      },
      (error) => {
        console.error('Error obteniendo ubicación', error);
        this.toastr.warning('No se pudo obtener tu ubicación. Puedes buscar o hacer clic en el mapa.', 'Aviso');
      }
    );
  }

  colocarMarcador(lat: number, lng: number): void {
    // Eliminar marcador anterior
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    // Eliminar círculo anterior
    if (this.areaCircle) {
      this.map.removeLayer(this.areaCircle);
    }

    // Crear ícono personalizado
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Nuevo marcador
    this.marker = L.marker([lat, lng], {
      icon: customIcon,
      draggable: true
    }).addTo(this.map);

    this.marker.bindPopup('Arrastra el marcador para ajustar la ubicación').openPopup();

    // Círculo de privacidad
    this.areaCircle = L.circle([lat, lng], {
      radius: this.RADIO_PRIVACIDAD,
      color: '#4285F4',
      fillColor: '#4285F4',
      fillOpacity: 0.2,
      weight: 2
    }).addTo(this.map);

    // Guardar coordenadas
    this.producto.latitud = lat;
    this.producto.longitud = lng;
    this.ubicacionSeleccionada = true;

    // Obtener dirección
    this.obtenerDireccion(lat, lng);

    // Listener para drag
    this.marker.on('dragend', (e: L.DragEndEvent) => {
      const position = this.marker.getLatLng();
      
      // Verificar que siga en Perú
      if (this.estaEnPeru(position.lat, position.lng)) {
        this.colocarMarcador(position.lat, position.lng);
      } else {
        this.toastr.warning('No puedes mover el marcador fuera de Perú', 'Ubicación inválida');
        // Regresar a posición anterior si existe
        if (this.producto.latitud !== undefined && this.producto.longitud !== undefined) {
          this.marker.setLatLng([this.producto.latitud, this.producto.longitud]);
        }
      }
    });
  }

  obtenerDireccion(lat: number, lng: number): void {
    // Usar Nominatim con countrycodes=pe
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&countrycodes=pe&accept-language=es`)
      .then(response => response.json())
      .then(data => {
        if (data.display_name) {
          this.producto.direccion = data.display_name;
        }
      })
      .catch(error => {
        console.error('Error obteniendo dirección', error);
      });
  }

  buscarDireccion(): void {
    if (!this.direccionBusqueda.trim()) {
      this.toastr.warning('Escribe una dirección para buscar', 'Búsqueda');
      return;
    }

    this.buscandoDireccion = true;
    
    // Usar Nominatim con countrycodes=pe
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(this.direccionBusqueda)}&format=json&countrycodes=pe&accept-language=es&addressdetails=1&limit=5`)
      .then(response => response.json())
      .then(data => {
        this.buscandoDireccion = false;
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          this.colocarMarcador(lat, lng);
          this.map.setView([lat, lng], 17);
          this.toastr.success('Dirección encontrada', 'Búsqueda');
        } else {
          this.toastr.error('No se encontró la dirección en Perú', 'Búsqueda');
        }
      })
      .catch(error => {
        console.error('Error buscando dirección', error);
        this.buscandoDireccion = false;
        this.toastr.error('Error al buscar la dirección', 'Error');
      });
  }

  limpiarUbicacion(): void {
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    if (this.areaCircle) {
      this.map.removeLayer(this.areaCircle);
    }
    this.producto.latitud = undefined;
    this.producto.longitud = undefined;
    this.producto.direccion = '';
    this.ubicacionSeleccionada = false;
    this.toastr.info('Ubicación eliminada', 'Información');
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    
    if (files.length === 0) return;

    if (this.selectedFiles.length + files.length > this.maxImages) {
      this.toastr.warning(`Máximo ${this.maxImages} imágenes permitidas`, 'Límite alcanzado');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        this.toastr.error(`${file.name} no es una imagen válida`, 'Formato inválido');
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error(`${file.name} excede el tamaño máximo de 5MB`, 'Archivo muy grande');
        continue;
      }

      this.selectedFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    }
    
    if (this.selectedFiles.length > 0) {
      this.toastr.info(`${this.selectedFiles.length} imagen(es) seleccionada(s)`, 'Imágenes');
    }
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.producto.nombre || this.producto.nombre.trim().length < 3) {
      this.errorMessage = 'El nombre debe tener al menos 3 caracteres';
      this.toastr.error(this.errorMessage, 'Error de validación');
      return;
    }

    if (!this.producto.descripcion || this.producto.descripcion.trim().length < 10) {
      this.errorMessage = 'La descripción debe tener al menos 10 caracteres';
      this.toastr.error(this.errorMessage, 'Error de validación');
      return;
    }

    if (this.producto.precio <= 0) {
      this.errorMessage = 'El precio debe ser mayor a 0';
      this.toastr.error(this.errorMessage, 'Error de validación');
      return;
    }

    if (this.producto.categoriaId === 0) {
      this.errorMessage = 'Debes seleccionar una categoría';
      this.toastr.error(this.errorMessage, 'Error de validación');
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.errorMessage = 'Debes subir al menos una imagen del producto';
      this.toastr.error(this.errorMessage, 'Error de validación');
      return;
    }

    this.isLoading = true;
    this.toastr.info('Creando producto...', 'Por favor espera');

    this.productoService.crearProducto(this.producto).subscribe({
      next: (productoCreado) => {
        console.log('Producto creado:', productoCreado);

        if (this.selectedFiles.length > 0) {
          this.subirImagenes(productoCreado.id);
        } else {
          this.isLoading = false;
          this.toastr.success('¡Producto publicado exitosamente!', '¡Éxito!');
          this.router.navigate(['/mis-publicaciones']);
        }
      },
      error: (error) => {
        console.error('Error al crear producto', error);
        this.errorMessage = error.error?.error || 'Error al publicar el producto';
        this.toastr.error(this.errorMessage, 'Error');
        this.isLoading = false;
      }
    });
  }

  subirImagenes(productoId: number): void {
    this.toastr.info('Subiendo imágenes...', 'Por favor espera');
    
    this.imagenService.subirMultiplesImagenes(productoId, this.selectedFiles).subscribe({
      next: (imagenes) => {
        console.log('Imágenes subidas:', imagenes);
        this.isLoading = false;
        this.toastr.success('¡Producto publicado con imágenes!', '¡Éxito!');
        this.router.navigate(['/mis-publicaciones']);
      },
      error: (error) => {
        console.error('Error al subir imágenes', error);
        this.isLoading = false;
        this.toastr.warning('Producto creado pero algunas imágenes fallaron', 'Advertencia');
        this.router.navigate(['/mis-publicaciones']);
      }
    });
  }
}