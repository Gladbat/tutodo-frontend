export enum Rol {
  USER = 'USER',
  ADMIN = 'ADMIN'
}


export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  numeroWhatsapp: string;
  fechaCreacion: string;
  rol: Rol;
  cantidadPublicaciones?: number;
  cantidadFavoritos?: number;
  suspendido?: boolean;
  eliminado?: boolean;
}

export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface RegisterRequest {
  email: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  numeroWhatsapp: string;
}

export interface AuthResponse {
  usuarioId: number;
  email: string;
  nombre: string;
  apellido: string;
  numeroWhatsapp: string;
  rol: Rol;
  mensaje: string;
}