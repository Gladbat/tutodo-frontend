import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const noAdminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si es admin, redirigir al dashboard de admin
  if (authService.isAdmin()) {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  return true;
};
