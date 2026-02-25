import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { ImagenService } from '../../services/imagen.service';
import { Producto, ProductoUpdateRequest } from '../../models/producto.model';
import { Categoria } from '../../models/categoria.model';

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './editar-producto.html',
  styleUrl: './editar-producto.css'
})
export class EditarProductoComponent implements OnInit {
  productoId: number = 0;
  producto: ProductoUpdateRequest = {};
  productoOriginal: Producto | null = null;
  
  categorias: Categoria[] = [];
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  // Imágenes existentes
  imagenesExistentes: any[] = [];
  
  // Nuevas imágenes a subir
  nuevasImagenes: File[] = [];
  nuevasImagenesPreviews: string[] = [];
  
  maxImages = 8;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private authService: AuthService,
    private imagenService: ImagenService
  ) {}

  ngOnInit(): void {
    // Verificar si está logueado
    if (!this.authService.isLoggedIn()) {
      alert('Debes iniciar sesión');
      this.router.navigate(['/login']);
      return;
    }

    // Obtener ID del producto de la URL
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productoId = Number(id);
      this.cargarProducto();
      this.cargarImagenes();
    }

    this.cargarCategorias();
  }

  cargarProducto(): void {
    this.productoService.obtenerProductoPorId(this.productoId).subscribe({
      next: (data) => {
        this.productoOriginal = data;
        
        // Verificar que es el dueño
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.usuarioId !== data.usuarioId) {
          alert('No tienes permiso para editar este producto');
          this.router.navigate(['/productos']);
          return;
        }

        // Llenar el formulario
        this.producto = {
          nombre: data.nombre,
          descripcion: data.descripcion,
          precio: data.precio,
          estado: data.estado,
          categoriaId: data.categoriaId,
          direccion: data.direccion,
          atributosExtra: data.atributosExtra
        };
      },
      error: (error) => {
        console.error('Error al cargar producto', error);
        alert('Producto no encontrado');
        this.router.navigate(['/mis-publicaciones']);
      }
    });
  }

  cargarImagenes(): void {
    this.imagenService.obtenerImagenesProducto(this.productoId).subscribe({
      next: (imagenes) => {
        this.imagenesExistentes = imagenes;
      },
      error: (error) => {
        console.error('Error al cargar imágenes', error);
      }
    });
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

  /**
   * Manejar selección de nuevas imágenes
   */
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    
    if (files.length === 0) return;

    const totalImagenes = this.imagenesExistentes.length + this.nuevasImagenes.length + files.length;
    
    if (totalImagenes > this.maxImages) {
      alert(`Máximo ${this.maxImages} imágenes en total (tienes ${this.imagenesExistentes.length} existentes)`);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        alert(`El archivo ${file.name} no es una imagen válida`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`El archivo ${file.name} excede el tamaño máximo de 5MB`);
        continue;
      }

      this.nuevasImagenes.push(file);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.nuevasImagenesPreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Quitar nueva imagen del preview
   */
  removeNewImage(index: number): void {
    this.nuevasImagenes.splice(index, 1);
    this.nuevasImagenesPreviews.splice(index, 1);
  }

  /**
   * Eliminar imagen existente
   */
  eliminarImagenExistente(imagen: any): void {
    if (confirm('¿Eliminar esta imagen?')) {
      this.imagenService.eliminarImagen(imagen.id).subscribe({
        next: () => {
          this.imagenesExistentes = this.imagenesExistentes.filter(img => img.id !== imagen.id);
          this.successMessage = 'Imagen eliminada';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error al eliminar imagen', error);
          alert('Error al eliminar la imagen');
        }
      });
    }
  }

  /**
   * Establecer imagen como principal
   */
  establecerPrincipal(imagen: any): void {
    this.imagenService.establecerImagenPrincipal(imagen.id).subscribe({
      next: () => {
        this.cargarImagenes();
        this.successMessage = 'Imagen principal actualizada';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error al establecer principal', error);
      }
    });
  }

  /**
   * Guardar cambios
   */
  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Validaciones
    if (this.producto.nombre && this.producto.nombre.trim().length < 3) {
      this.errorMessage = 'El nombre debe tener al menos 3 caracteres';
      return;
    }

    if (this.producto.descripcion && this.producto.descripcion.trim().length < 10) {
      this.errorMessage = 'La descripción debe tener al menos 10 caracteres';
      return;
    }

    if (this.producto.precio && this.producto.precio <= 0) {
      this.errorMessage = 'El precio debe ser mayor a 0';
      return;
    }

    // Verificar que hay al menos una imagen
    if (this.imagenesExistentes.length === 0 && this.nuevasImagenes.length === 0) {
      this.errorMessage = 'Debe haber al menos una imagen';
      return;
    }

    this.isLoading = true;

    // 1. Actualizar producto
    this.productoService.actualizarProducto(this.productoId, this.producto).subscribe({
      next: (productoActualizado) => {
        console.log('Producto actualizado:', productoActualizado);

        // 2. Subir nuevas imágenes si hay
        if (this.nuevasImagenes.length > 0) {
          this.subirNuevasImagenes();
        } else {
          this.isLoading = false;
          this.successMessage = '¡Producto actualizado exitosamente!';
          setTimeout(() => {
            this.router.navigate(['/mis-publicaciones']);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Error al actualizar producto', error);
        this.errorMessage = error.error?.error || 'Error al actualizar el producto';
        this.isLoading = false;
      }
    });
  }

  /**
   * Subir nuevas imágenes
   */
  subirNuevasImagenes(): void {
    this.imagenService.subirMultiplesImagenes(this.productoId, this.nuevasImagenes).subscribe({
      next: (imagenes) => {
        console.log('Nuevas imágenes subidas:', imagenes);
        this.isLoading = false;
        this.successMessage = '¡Producto e imágenes actualizados exitosamente!';
        setTimeout(() => {
          this.router.navigate(['/mis-publicaciones']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error al subir nuevas imágenes', error);
        this.isLoading = false;
        this.successMessage = 'Producto actualizado pero hubo un error con algunas imágenes';
        setTimeout(() => {
          this.router.navigate(['/mis-publicaciones']);
        }, 3000);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/mis-publicaciones']);
  }
}