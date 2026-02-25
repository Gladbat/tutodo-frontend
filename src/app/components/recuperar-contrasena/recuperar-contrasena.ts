import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.css'
})
export class RecuperarContrasena {
  // Pasos del proceso
  paso = 1; // 1: Email, 2: Pregunta, 3: Nueva contraseña

  // Datos del formulario
  email = '';
  preguntaSeguridad = '';
  respuesta = '';
  nuevaContrasena = '';
  confirmarContrasena = '';

  // Estados
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  // Paso 1: Verificar email
  verificarEmail(): void {
    if (!this.email || !this.email.includes('@')) {
      this.toastr.error('Ingresa un email válido', 'Error');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verificarEmail(this.email).subscribe({
      next: (response) => {
        if (response.tienePregunta) {
          this.preguntaSeguridad = response.pregunta;
          this.paso = 2;
          this.toastr.success('Email verificado', 'Continúa');
        } else {
          this.toastr.error(response.pregunta, 'Sin pregunta de seguridad');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al verificar email';
        this.toastr.error(this.errorMessage, 'Error');
        this.isLoading = false;
      }
    });
  }

  // Paso 2: Verificar respuesta
  verificarRespuesta(): void {
    if (!this.respuesta || this.respuesta.trim().length < 2) {
      this.toastr.error('Ingresa tu respuesta', 'Error');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verificarRespuesta(this.email, this.respuesta).subscribe({
      next: (response) => {
        if (response.valida) {
          this.paso = 3;
          this.toastr.success('Respuesta correcta', '¡Bien!');
        } else {
          this.toastr.error('Respuesta incorrecta', 'Error');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Respuesta incorrecta';
        this.toastr.error(this.errorMessage, 'Error');
        this.isLoading = false;
      }
    });
  }

  // Paso 3: Restablecer contraseña
  restablecerContrasena(): void {
    if (!this.nuevaContrasena || this.nuevaContrasena.length < 6) {
      this.toastr.error('La contraseña debe tener al menos 6 caracteres', 'Error');
      return;
    }

    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.toastr.error('Las contraseñas no coinciden', 'Error');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.restablecerContrasena(this.email, this.nuevaContrasena).subscribe({
      next: (response) => {
        this.toastr.success('Contraseña restablecida exitosamente', '¡Listo!');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al restablecer contraseña';
        this.toastr.error(this.errorMessage, 'Error');
        this.isLoading = false;
      }
    });
  }

  // Volver al paso anterior
  volverPaso(): void {
    if (this.paso > 1) {
      this.paso--;
      this.errorMessage = '';
    }
  }
}
