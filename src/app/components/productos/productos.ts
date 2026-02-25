import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { FavoritoService } from '../../services/favorito.service';
import { Page } from '../../models/page.model';

@Component({
  selector: 'app-productos',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class Productos implements OnInit {
  productos: any[] = [];
  categorias: any[] = [];
  selectedCategoriaId: number | null = null;
  searchKeyword = '';
  isLoading = false;

  // Paginación
  currentPage = 0;
  pageSize = 12;
  totalElements = 0;
  totalPages = 0;
  Math = Math; // Para usar Math.min en el template

  constructor(
    private authService: AuthService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private favoritoService: FavoritoService
  ) {}

  ngOnInit() {
    this.cargarCategorias();
    this.cargarProductosPaginados();
  }

  cargarCategorias() {
    this.categoriaService.obtenerTodasCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (error) => {
        console.error('Error al cargar categorías', error);
        // Fallback a datos de prueba si falla
        this.categorias = [
          { id: 1, nombre: 'Electrónica' },
          { id: 2, nombre: 'Celulares' },
          { id: 3, nombre: 'Deportes' },
          { id: 4, nombre: 'Muebles' },
          { id: 5, nombre: 'Videojuegos' },
          { id: 6, nombre: 'Electrodomésticos' },
          { id: 7, nombre: 'Ropa' },
          { id: 8, nombre: 'Vehículos' }
        ];
      }
    });
  }

  cargarProductos() {
    this.isLoading = true;
    this.productoService.obtenerProductosActivos().subscribe({
      next: (data) => {
        this.productos = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar productos', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Cargar productos con paginación
   */
  cargarProductosPaginados(): void {
    this.isLoading = true;
    const currentUser = this.authService.getCurrentUser();
    const usuarioId = currentUser?.usuarioId;
    
    this.productoService.obtenerProductosActivosPaginados(this.currentPage, this.pageSize, usuarioId).subscribe({
      next: (page: Page<any>) => {
        this.productos = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.currentPage = page.number;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar productos', error);
        this.isLoading = false;
      }
    });
  }

  filtrarPorCategoria(categoriaId: number | null): void {
    this.selectedCategoriaId = categoriaId;
    this.searchKeyword = '';
    this.currentPage = 0; // Resetear a primera página
    this.isLoading = true;
    const currentUser = this.authService.getCurrentUser();
    const usuarioId = currentUser?.usuarioId;
    
    if (categoriaId === null) {
      this.cargarProductosPaginados();
    } else {
      this.productoService.obtenerProductosPorCategoriaPaginados(categoriaId, this.currentPage, this.pageSize, usuarioId).subscribe({
        next: (page: Page<any>) => {
          this.productos = page.content;
          this.totalElements = page.totalElements;
          this.totalPages = page.totalPages;
          this.currentPage = page.number;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al filtrar productos', error);
          this.isLoading = false;
        }
      });
    }
  }

  buscarProductos(): void {
    if (this.searchKeyword.trim() === '') {
      this.cargarProductosPaginados();
      return;
    }

    this.isLoading = true;
    this.selectedCategoriaId = null;
    this.currentPage = 0; // Resetear a primera página
    const currentUser = this.authService.getCurrentUser();
    const usuarioId = currentUser?.usuarioId;

    this.productoService.buscarProductosPaginados(this.searchKeyword, this.currentPage, this.pageSize, usuarioId).subscribe({
      next: (page: Page<any>) => {
        this.productos = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.currentPage = page.number;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al buscar productos', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Cambiar de página
   */
  cambiarPagina(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Recargar según el filtro activo
    if (this.searchKeyword.trim() !== '') {
      this.buscarProductos();
    } else if (this.selectedCategoriaId !== null) {
      this.filtrarPorCategoria(this.selectedCategoriaId);
    } else {
      this.cargarProductosPaginados();
    }
  }

  /**
   * Obtener números de página para mostrar
   */
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

  agregarAFavoritos(producto: any): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || !currentUser.usuarioId) {
      alert('Debes iniciar sesión para agregar favoritos');
      return;
    }

    console.log('Agregando a favoritos:', {
      usuarioId: currentUser.usuarioId,
      productoId: producto.id
    });

    this.favoritoService.agregarFavorito({
      usuarioId: currentUser.usuarioId,
      productoId: producto.id
    }).subscribe({
      next: (response) => {
        console.log('Favorito agregado exitosamente:', response);
        alert(`Producto "${producto.nombre}" agregado a favoritos`);
        // Actualizar el contador de favoritos si existe
        if (producto.cantidadFavoritos !== undefined) {
          producto.cantidadFavoritos++;
        }
      },
      error: (error) => {
        console.error('Error al agregar favorito:', error);
        if (error.error?.error) {
          alert(error.error.error);
        } else {
          alert('Error al agregar a favoritos');
        }
      }
    });
  }

  getImageUrl(producto: any): string {
    if (producto.imagenPrincipal) {
      return producto.imagenPrincipal;
    }
    if (producto.imagenesUrls && producto.imagenesUrls.length > 0) {
      return producto.imagenesUrls[0];
    }
    return 'https://via.placeholder.com/400x300?text=Sin+Imagen';
  }

  abrirWhatsApp(producto: any): void {
    if (!producto.usuarioWhatsapp) {
      alert('El vendedor no tiene WhatsApp configurado');
      return;
    }

    const mensaje = `Hola! Me interesa tu producto: ${producto.nombre} publicado en Tutodo`;
    const url = `https://wa.me/${producto.usuarioWhatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}