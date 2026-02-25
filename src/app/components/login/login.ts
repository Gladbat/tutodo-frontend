import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginData = {
    email: '',
    contrasena: ''
  };
  
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.login(this.loginData.email, this.loginData.contrasena).subscribe({
      next: (response) => {
        console.log('Login exitoso', response);
        
        // Redirigir según el rol
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/productos']);
        }
      },
      error: (error) => {
        console.error('Error en login', error);
        
        // Extraer mensaje de error del backend
        const errorMsg = error.error?.error || error.error?.mensaje || 'Error al iniciar sesión';
        
        // Verificar si es cuenta suspendida o eliminada
        if (errorMsg.includes('Cuenta suspendida') || errorMsg.includes('Cuenta eliminada')) {
          this.errorMessage = errorMsg; // Mostrar mensaje completo del backend
        } else if (errorMsg.includes('Credenciales incorrectas')) {
          this.errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
        } else {
          this.errorMessage = errorMsg;
        }
        
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
