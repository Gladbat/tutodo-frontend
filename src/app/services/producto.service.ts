import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, ProductoCreateRequest, ProductoUpdateRequest } from '../models/producto.model';
import { Page } from '../models/page.model';  // ← Agregar import
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = `${environment.apiUrl}/api/productos`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los productos activos
   */
  obtenerProductosActivos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  /**
   * Obtener producto por ID
   */
  obtenerProductoPorId(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Buscar productos
   */
  buscarProductos(keyword: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/buscar?q=${keyword}`);
  }

  /**
   * Obtener productos por categoría
   */
  obtenerProductosPorCategoria(categoriaId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/categoria/${categoriaId}`);
  }

  /**
   * Obtener productos de un usuario
   */
  obtenerProductosPorUsuario(usuarioId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  /**
   * Crear producto
   */
  crearProducto(producto: ProductoCreateRequest): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto);
  }

  /**
   * Actualizar producto
   */
  actualizarProducto(id: number, producto: ProductoUpdateRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, producto);
  }

  /**
   * Marcar como vendido
   */
  marcarComoVendido(id: number): Observable<Producto> {
    return this.http.patch<Producto>(`${this.apiUrl}/${id}/vendido`, {});
  }

  /**
   * Eliminar producto
   */
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }


obtenerProductosActivosPaginados(page: number = 0, size: number = 12, usuarioId?: number): Observable<Page<Producto>> {
  let url = `${this.apiUrl}/paginado?page=${page}&size=${size}`;
  if (usuarioId) {
    url += `&usuarioId=${usuarioId}`;
  }
  return this.http.get<Page<Producto>>(url);
}

/**
 * Buscar productos con paginación
 */
buscarProductosPaginados(keyword: string, page: number = 0, size: number = 12, usuarioId?: number): Observable<Page<Producto>> {
  let url = `${this.apiUrl}/buscar/paginado?q=${keyword}&page=${page}&size=${size}`;
  if (usuarioId) {
    url += `&usuarioId=${usuarioId}`;
  }
  return this.http.get<Page<Producto>>(url);
}

/**
 * Obtener productos por categoría con paginación
 */
obtenerProductosPorCategoriaPaginados(categoriaId: number, page: number = 0, size: number = 12, usuarioId?: number): Observable<Page<Producto>> {
  let url = `${this.apiUrl}/categoria/${categoriaId}/paginado?page=${page}&size=${size}`;
  if (usuarioId) {
    url += `&usuarioId=${usuarioId}`;
  }
  return this.http.get<Page<Producto>>(url);
}

  
}