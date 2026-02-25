import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FavoritoService } from '../../services/favorito.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-favoritos',
  imports: [CommonModule, RouterLink],
  templateUrl: './favoritos.html',
  styleUrl: './favoritos.css'
})
export class Favoritos implements OnInit {
  favoritos: any[] = [];
  isLoading = false;

  constructor(
    private authService: AuthService,
    private favoritoService: FavoritoService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      this.toastr.warning('Debes iniciar sesión', 'Acción requerida');
      this.router.navigate(['/login']);
      return;
    }

    this.cargarFavoritos(currentUser.usuarioId!);
  }

  cargarFavoritos(usuarioId: number): void {
    this.isLoading = true;
    
    // Conectar al backend
    this.favoritoService.obtenerFavoritosPorUsuario(usuarioId).subscribe({
      next: (data) => {
        this.favoritos = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar favoritos', error);
        this.isLoading = false;
        this.toastr.error('Error al cargar tus favoritos', 'Error');
      }
    });
  }

  quitarDeFavoritos(favorito: any): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.usuarioId) return;

    if (confirm('¿Quitar este producto de favoritos?')) {
      this.favoritoService.eliminarFavorito(favorito.id, currentUser.usuarioId).subscribe({
        next: () => {
          this.favoritos = this.favoritos.filter(f => f.id !== favorito.id);
          this.toastr.info('Producto quitado de favoritos', 'Favoritos');
        },
        error: (error) => {
          console.error('Error al quitar favorito', error);
          this.toastr.error('Error al quitar de favoritos', 'Error');
        }
      });
    }
  }

  abrirWhatsApp(favorito: any): void {
    if (!favorito.producto || !favorito.producto.usuarioWhatsapp) {
      this.toastr.warning('El vendedor no tiene WhatsApp configurado', 'WhatsApp');
      return;
    }

    this.toastr.info('Abriendo WhatsApp...', 'Contacto');
    const mensaje = `Hola! Me interesa tu producto: ${favorito.producto.nombre} publicado en Tutodo`;
    const url = `https://wa.me/${favorito.producto.usuarioWhatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  getImageUrl(favorito: any): string {
    if (!favorito.producto) {
      return 'https://via.placeholder.com/300x200?text=Sin+Imagen';
    }

    if (favorito.producto.imagenPrincipal) {
      return favorito.producto.imagenPrincipal;
    }
    if (favorito.producto.imagenesUrls && favorito.producto.imagenesUrls.length > 0) {
      return favorito.producto.imagenesUrls[0];
    }
    return 'https://via.placeholder.com/300x200?text=Sin+Imagen';
  }
}