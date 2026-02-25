import { Producto } from './producto.model';

export interface Favorito {
  id: number;
  usuarioId: number;
  productoId: number;
  producto?: Producto;
  fechaCreacion: string;
}

export interface FavoritoRequest {
  usuarioId: number;
  productoId: number;
}