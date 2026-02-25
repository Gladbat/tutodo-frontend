import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { ToastrService } from 'ngx-toastr';
import { WhatsappFormatPipe } from '../../pipes/whatsapp-format.pipe';

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, FormsModule, RouterLink, WhatsappFormatPipe],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  usuario: User | null = null;
  editMode = false;
  
  perfilData: any = {
    nombre: '',
    apellido: '',
    numeroWhatsapp: '',
    preguntaSeguridad: '',
    respuestaSeguridad: ''
  };
  
  whatsappInput = ''; // Solo los 9 dígitos
  
  nuevaContrasena = '';
  confirmarContrasena = '';
  
  preguntasSeguridad = [
    '¿Cuál es el nombre de tu primera mascota?',
    '¿En qué ciudad naciste?',
    '¿Cuál es tu comida favorita?',
    '¿Cuál es el nombre de tu mejor amigo de la infancia?',
    '¿Cuál es tu película favorita?',
    '¿Cuál fue el nombre de tu primera escuela?'
  ];
  
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router,
    private toastr: ToastrService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getCurrentUser();
    
    if (!this.usuario) {
      this.router.navigate(['/login']);
      return;
    }

    this.perfilData = {
      nombre: this.usuario.nombre,
      apellido: this.usuario.apellido,
      numeroWhatsapp: this.usuario.numeroWhatsapp,
      preguntaSeguridad: '',
      respuestaSeguridad: ''
    };
    
    // Extraer solo los 9 dígitos para el input
    this.whatsappInput = this.usuario.numeroWhatsapp.replace('+51', '').replace(/\s/g, '');
  }

  onWhatsappInput(): void {
    // Remover todo excepto números
    this.whatsappInput = this.whatsappInput.replace(/\D/g, '');
    
    // Limitar a 9 dígitos
    if (this.whatsappInput.length > 9) {
      this.whatsappInput = this.whatsappInput.substring(0, 9);
    }
    
    // Actualizar el valor completo con +51
    this.perfilData.numeroWhatsapp = '+51' + this.whatsappInput;
  }

  activarEdicion(): void {
    this.editMode = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelarEdicion(): void {
    this.editMode = false;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Restaurar datos originales
    if (this.usuario) {
      this.perfilData = {
        nombre: this.usuario.nombre,
        apellido: this.usuario.apellido,
        numeroWhatsapp: this.usuario.numeroWhatsapp,
        preguntaSeguridad: '',
        respuestaSeguridad: ''
      };
      this.whatsappInput = this.usuario.numeroWhatsapp.replace('+51', '').replace(/\s/g, '');
    }
    this.nuevaContrasena = '';
    this.confirmarContrasena = '';
  }

  guardarCambios(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.nuevaContrasena || this.confirmarContrasena) {
      if (this.nuevaContrasena !== this.confirmarContrasena) {
        this.errorMessage = 'Las contraseñas no coinciden';
        this.toastr.error(this.errorMessage, 'Error de validación');
        return;
      }
      if (this.nuevaContrasena.length < 6) {
        this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        this.toastr.error(this.errorMessage, 'Error de validación');
        return;
      }
      this.perfilData.contrasena = this.nuevaContrasena;
    }

    // Validar formato de WhatsApp (9 dígitos)
    const soloNumeros = this.whatsappInput.replace(/\D/g, '');
    if (soloNumeros.length !== 9) {
      this.errorMessage = 'El número de WhatsApp debe tener 9 dígitos';
      this.toastr.error(this.errorMessage, 'Error de validación');
      return;
    }

    // Asegurar formato correcto
    this.perfilData.numeroWhatsapp = '+51' + soloNumeros;

    // Validar pregunta de seguridad si se está actualizando
    if (this.perfilData.preguntaSeguridad && !this.perfilData.respuestaSeguridad) {
      this.errorMessage = 'Debes proporcionar una respuesta a la pregunta de seguridad';
      this.toastr.error(this.errorMessage, 'Error de validación');
      return;
    }

    if (this.perfilData.respuestaSeguridad && !this.perfilData.preguntaSeguridad) {
      this.errorMessage = 'Debes seleccionar una pregunta de seguridad';
      this.toastr.error(this.errorMessage, 'Error de validación');
      return;
    }

    // Limpiar campos vacíos antes de enviar
    const dataToSend: any = {};
    if (this.perfilData.nombre) dataToSend.nombre = this.perfilData.nombre;
    if (this.perfilData.apellido) dataToSend.apellido = this.perfilData.apellido;
    if (this.perfilData.numeroWhatsapp) dataToSend.numeroWhatsapp = this.perfilData.numeroWhatsapp;
    if (this.perfilData.contrasena) dataToSend.contrasena = this.perfilData.contrasena;
    if (this.perfilData.preguntaSeguridad) dataToSend.preguntaSeguridad = this.perfilData.preguntaSeguridad;
    if (this.perfilData.respuestaSeguridad) dataToSend.respuestaSeguridad = this.perfilData.respuestaSeguridad;

    this.isLoading = true;

    this.http.put<any>(`http://localhost:8080/api/usuarios/${this.usuario?.usuarioId}`, dataToSend)
      .subscribe({
        next: (response) => {
          console.log('Perfil actualizado', response);
          this.toastr.success('¡Perfil actualizado exitosamente!', '¡Éxito!');
          this.editMode = false;
          this.nuevaContrasena = '';
          this.confirmarContrasena = '';
          
          if (this.usuario) {
            this.usuario.nombre = this.perfilData.nombre || this.usuario.nombre;
            this.usuario.apellido = this.perfilData.apellido || this.usuario.apellido;
            this.usuario.numeroWhatsapp = this.perfilData.numeroWhatsapp || this.usuario.numeroWhatsapp;
            localStorage.setItem('currentUser', JSON.stringify(this.usuario));
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al actualizar perfil', error);
          this.errorMessage = error.error?.error || 'Error al actualizar el perfil';
          this.toastr.error(this.errorMessage, 'Error');
          this.isLoading = false;
        }
      });
  }
}
