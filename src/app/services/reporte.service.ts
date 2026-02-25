import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReporteRequest {
  productoId: number;
  usuarioReportadorId: number;
  razon: string;
  comentario?: string;
}

export interface ReporteDTO {
  id: number;
  productoId: number;
  productoNombre: string;
  usuarioReportadorId: number;
  usuarioReportadorNombre: string;
  razon: string;
  comentario?: string;
  fechaCreacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private apiUrl = 'http://localhost:8080/api/reportes';

  // Razones predefinidas para reportar
  readonly RAZONES_REPORTE = [
    'Precio distinto a lo publicado',
    'Las imágenes no tienen relación con el producto real',
    'Producto no disponible',
    'Descripción engañosa',
    'Contenido inapropiado',
    'Posible estafa',
    'Duplicado',
    'Otro'
  ];

  constructor(private http: HttpClient) { }

  /**
   * Crear un reporte
   */
  crearReporte(request: ReporteRequest): Observable<ReporteDTO> {
    return this.http.post<ReporteDTO>(this.apiUrl, request);
  }

  /**
   * Obtener reportes de un producto
   */
  obtenerReportesPorProducto(productoId: number): Observable<ReporteDTO[]> {
    return this.http.get<ReporteDTO[]>(`${this.apiUrl}/producto/${productoId}`);
  }

  /**
   * Obtener reportes realizados por un usuario
   */
  obtenerMisReportes(usuarioId: number): Observable<ReporteDTO[]> {
    return this.http.get<ReporteDTO[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  /**
   * Contar reportes de un producto
   */
  contarReportes(productoId: number): Observable<{cantidad: number}> {
    return this.http.get<{cantidad: number}>(`${this.apiUrl}/producto/${productoId}/count`);
  }

  /**
   * Verificar si un usuario ya reportó un producto
   */
  verificarReporte(productoId: number, usuarioId: number): Observable<{yaReporto: boolean}> {
    return this.http.get<{yaReporto: boolean}>(`${this.apiUrl}/verificar/${productoId}/${usuarioId}`);
  }
}