import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerData = {
    email: '',
    contrasena: '',
    nombre: '',
    apellido: '',
    numeroWhatsapp: '',
    preguntaSeguridad: '',
    respuestaSeguridad: ''
  };
  
  whatsappInput = ''; // Solo los 9 dígitos
  
  confirmarContrasena = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService  // ← AGREGAR

  ) {}

  onWhatsappInput(): void {
    // Remover todo excepto números
    this.whatsappInput = this.whatsappInput.replace(/\D/g, '');
    
    // Limitar a 9 dígitos
    if (this.whatsappInput.length > 9) {
      this.whatsappInput = this.whatsappInput.substring(0, 9);
    }
    
    // Actualizar el valor completo con +51
    this.registerData.numeroWhatsapp = '+51' + this.whatsappInput;
  }

  onSubmit(): void {
    this.errorMessage = '';

    // Validar contraseñas coincidan
    if (this.registerData.contrasena !== this.confirmarContrasena) {
      this.errorMessage = 'Las contraseñas no coinciden';
      this.toastr.error('Las contraseñas no coinciden', 'Error de validación');
      return;
    }

    // Validar formato de WhatsApp (9 dígitos)
    const soloNumeros = this.whatsappInput.replace(/\D/g, '');
    if (soloNumeros.length !== 9) {
      this.errorMessage = 'El número de WhatsApp debe tener 9 dígitos';
      this.toastr.error(this.errorMessage, 'Error de validación');
      return;
    }

    // Validar pregunta y respuesta de seguridad
    if (!this.registerData.preguntaSeguridad) {
      this.errorMessage = 'Debes seleccionar una pregunta de seguridad';
      this.toastr.error(this.errorMessage, 'Error de validación');
      return;
    }

    if (!this.registerData.respuestaSeguridad || this.registerData.respuestaSeguridad.trim().length < 2) {
      this.errorMessage = 'La respuesta de seguridad debe tener al menos 2 caracteres';
      this.toastr.error(this.errorMessage, 'Error de validación');
      return;
    }

    // Asegurar formato correcto
    this.registerData.numeroWhatsapp = '+51' + soloNumeros;

    this.isLoading = true;

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        console.log('Registro exitoso', response);
        this.toastr.success('¡Cuenta creada exitosamente!', '¡Bienvenido a Tutodo!');
        this.router.navigate(['/productos']);
      },
      error: (error) => {
        console.error('Error en registro', error);
        this.errorMessage = error.error?.error || 'Error al registrar usuario.';
        this.toastr.error(this.errorMessage, 'Error de registro');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}