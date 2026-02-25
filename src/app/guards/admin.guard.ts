import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.getCurrentUser();
  
  if (currentUser && currentUser.rol === 'ADMIN') {
    return true;
  }

  alert('Acceso denegado. Se requiere rol de administrador.');
  router.navigate(['/']);
  return false;
};