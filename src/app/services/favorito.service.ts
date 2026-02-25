import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Favorito, FavoritoRequest } from '../models/favorito.model';

@Injectable({
  providedIn: 'root'
})
export class FavoritoService {
  private apiUrl = 'http://localhost:8080/api/favoritos';
  
  private favoritosSubject = new BehaviorSubject<Favorito[]>([]);
  public favoritos$ = this.favoritosSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Obtener favoritos de un usuario
   */
  obtenerFavoritosPorUsuario(usuarioId: number): Observable<Favorito[]> {
    return this.http.get<Favorito[]>(`${this.apiUrl}/usuario/${usuarioId}`)
      .pipe(
        tap(favoritos => this.favoritosSubject.next(favoritos))
      );
  }

  /**
   * Verificar si un producto es favorito
   */
  esFavorito(usuarioId: number, productoId: number): Observable<{esFavorito: boolean}> {
    return this.http.get<{esFavorito: boolean}>(`${this.apiUrl}/verificar?usuarioId=${usuarioId}&productoId=${productoId}`);
  }

  /**
   * Agregar a favoritos
   */
  agregarFavorito(request: FavoritoRequest): Observable<Favorito> {
    return this.http.post<Favorito>(this.apiUrl, request)
      .pipe(
        tap(() => this.refrescarFavoritos(request.usuarioId))
      );
  }

  /**
   * Quitar de favoritos
   */
  quitarFavorito(usuarioId: number, productoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?usuarioId=${usuarioId}&productoId=${productoId}`)
      .pipe(
        tap(() => this.refrescarFavoritos(usuarioId))
      );
  }

  /**
   * Eliminar favorito por ID
   */
  eliminarFavorito(favoritoId: number, usuarioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${favoritoId}`)
      .pipe(
        tap(() => this.refrescarFavoritos(usuarioId))
      );
  }

  /**
   * Refrescar lista de favoritos
   */
  private refrescarFavoritos(usuarioId: number): void {
    this.obtenerFavoritosPorUsuario(usuarioId).subscribe();
  }

  /**
   * Obtener cantidad de favoritos
   */
  getCantidadFavoritos(): number {
    return this.favoritosSubject.value.length;
  }
}