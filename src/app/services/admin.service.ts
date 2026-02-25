import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { Producto } from '../models/producto.model';

export interface Estadisticas {
  totalUsuarios: number;
  totalAdmins: number;
  totalProductos: number;
  productosActivos: number;
  productosVendidos: number;
  totalReportes: number;
  totalFavoritos: number;
  totalCategorias: number;
}

export interface Reporte {
  id: number;
  productoId: number;
  productoNombre: string;
  usuarioReportadorId: number;
  usuarioReportadorNombre: string;
  razon: string;
  comentario: string;
  fechaCreacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) { }

  /**
   * Obtener estadísticas generales
   */
  obtenerEstadisticas(adminId: number): Observable<Estadisticas> {
    return this.http.get<Estadisticas>(`${this.apiUrl}/estadisticas?adminId=${adminId}`);
  }

  /**
   * Obtener todos los usuarios
   */
  obtenerTodosUsuarios(adminId: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios?adminId=${adminId}`);
  }

  /**
   * Obtener todos los productos
   */
  obtenerTodosProductos(adminId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/productos?adminId=${adminId}`);
  }

  /**
   * Obtener todos los reportes
   */
  obtenerTodosReportes(adminId: number): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(`${this.apiUrl}/reportes?adminId=${adminId}`);
  }

  /**
   * Eliminar producto (admin)
   */
  eliminarProducto(productoId: number, adminId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/productos/${productoId}?adminId=${adminId}`);
  }

  /**
   * Reactivar producto (admin)
   */
  reactivarProducto(productoId: number, adminId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/productos/${productoId}/reactivar?adminId=${adminId}`, {});
  }

  /**
   * Inhabilitar producto (admin)
   */
  inhabilitarProducto(productoId: number, adminId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/productos/${productoId}/inhabilitar?adminId=${adminId}`, {});
  }

  /**
   * Suspender usuario (admin)
   */
  suspenderUsuario(usuarioId: number, adminId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${usuarioId}/suspender?adminId=${adminId}`, {});
  }

  /**
   * Reactivar usuario (admin)
   */
  reactivarUsuario(usuarioId: number, adminId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${usuarioId}/reactivar?adminId=${adminId}`, {});
  }

  /**
   * Eliminar usuario (admin)
   */
  eliminarUsuario(usuarioId: number, adminId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${usuarioId}?adminId=${adminId}`);
  }
}