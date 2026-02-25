import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { RecuperarContrasena } from './components/recuperar-contrasena/recuperar-contrasena';
import { Productos } from './components/productos/productos';
import { ProductosDetalle } from './components/productos-detalle/productos-detalle';
import { PublicarProductoComponent } from './components/publicar-producto/publicar-producto';
import { EditarProductoComponent } from './components/editar-producto/editar-producto';
import { Perfil } from './components/perfil/perfil';
import { MisPublicaciones } from './components/mis-publicaciones/mis-publicaciones';
import { Favoritos } from './components/favoritos/favoritos';
import { Dashboard } from './components/dashboard/dashboard';
import { MisReportesComponent } from './components/mis-reportes/mis-reportes';
import { BusquedaCercanaComponent } from './components/busqueda-cercana/busqueda-cercana';
import { DashboardComponent as AdminDashboard } from './components/admin/dashboard/dashboard';
import { UsuariosComponent } from './components/admin/usuarios/usuarios';
import { ProductosAdminComponent } from './components/admin/productos-admin/productos-admin';
import { ReportesAdminComponent } from './components/admin/reportes-admin/reportes-admin';
import { adminGuard } from './guards/admin.guard';
import { noAdminGuard } from './guards/no-admin.guard';

export const routes: Routes = [
  { 
    path: '', 
    component: Home,
    canActivate: [noAdminGuard]
  },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'recuperar-contrasena', component: RecuperarContrasena },
  { path: 'productos', component: Productos },
  { path: 'productos/:id', component: ProductosDetalle },
  { path: 'publicar', component: PublicarProductoComponent },
  { path: 'editar/:id', component: EditarProductoComponent },
  { path: 'perfil', component: Perfil },
  { path: 'mis-publicaciones', component: MisPublicaciones },
  { path: 'favoritos', component: Favoritos},
  { path: 'mis-reportes', component: MisReportesComponent },
  { path: 'dashboard', component: Dashboard },
  { 
    path: 'buscar-cercanos', 
    component: BusquedaCercanaComponent,
    canActivate: [noAdminGuard]
  },
  
  // Rutas de administrador
  { 
    path: 'admin/dashboard', 
    component: AdminDashboard,
    canActivate: [adminGuard]
  },
  { 
    path: 'admin/usuarios', 
    component: UsuariosComponent,
    canActivate: [adminGuard]
  },
  { 
    path: 'admin/productos', 
    component: ProductosAdminComponent,
    canActivate: [adminGuard]
  },
  { 
    path: 'admin/reportes', 
    component: ReportesAdminComponent,
    canActivate: [adminGuard]
  },
  
  { path: '**', redirectTo: '' }
];