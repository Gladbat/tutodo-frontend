import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Producto } from '../models/producto.model';

export interface BusquedaCercanaResponse {
  productos: Producto[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class BusquedaCercanaService {
  private apiUrl = `${environment.apiUrl}/api/productos`;

  constructor(private http: HttpClient) {}

  /**
   * Buscar productos cercanos a una ubicación
   */
  buscarCercanos(
    latitud: number,
    longitud: number,
    radioKm: number,
    categoriaId?: number
  ): Observable<BusquedaCercanaResponse> {
    let params = new HttpParams()
      .set('latitud', latitud.toString())
      .set('longitud', longitud.toString())
      .set('radio', radioKm.toString());

    if (categoriaId) {
      params = params.set('categoriaId', categoriaId.toString());
    }

    return this.http.get<BusquedaCercanaResponse>(`${this.apiUrl}/cercanos`, { params });
  }

  /**
   * Calcular distancia entre dos puntos usando fórmula de Haversine
   * @returns distancia en kilómetros
   */
  calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;
    
    return Math.round(distancia * 100) / 100; // Redondear a 2 decimales
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
