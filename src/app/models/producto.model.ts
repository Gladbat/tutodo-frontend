export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  estado: string;
  atributosExtra?: string;
  latitud?: number;
  longitud?: number;
  direccion?: string;
  categoriaId: number;
  categoriaNombre?: string;
  usuarioId: number;
  usuarioNombre?: string;
  usuarioWhatsapp?: string;
  imagenesUrls?: string[];
  imagenPrincipal?: string;
  estaActivo: boolean;
  vendido: boolean;
  eliminado?: boolean;
  eliminadoPor?: string; // "USUARIO" o "ADMIN"
  fechaCreacion: string;
  fechaActualizacion: string;
  cantidadFavoritos?: number;
}

export interface ProductoCreateRequest {
  nombre: string;
  descripcion: string;
  precio: number;
  estado: string;
  atributosExtra?: string;
  latitud?: number;
  longitud?: number;
  direccion?: string;
  categoriaId: number;
  usuarioId: number;
}

export interface ProductoUpdateRequest {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  estado?: string;
  atributosExtra?: string;
  latitud?: number;
  longitud?: number;
  direccion?: string;
  categoriaId?: number;
  estaActivo?: boolean;
  vendido?: boolean;
}