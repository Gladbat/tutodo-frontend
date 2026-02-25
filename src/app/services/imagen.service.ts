import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ImagenProducto {
  id: number;
  productoId: number;
  urlImagen: string;
  esPrincipal: boolean;
  orden: number;
  fechaCreacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImagenService {
  private apiUrl = 'http://localhost:8080/api/imagenes';

  constructor(private http: HttpClient) { }

  /**
   * Subir una imagen a un producto
   */
  subirImagen(productoId: number, file: File, esPrincipal: boolean = false, orden: number = 0): Observable<ImagenProducto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('esPrincipal', esPrincipal.toString());
    formData.append('orden', orden.toString());

    return this.http.post<ImagenProducto>(`${this.apiUrl}/producto/${productoId}`, formData);
  }

  /**
   * Subir múltiples imágenes a un producto
   */
  subirMultiplesImagenes(productoId: number, files: File[]): Observable<ImagenProducto[]> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    return this.http.post<ImagenProducto[]>(`${this.apiUrl}/producto/${productoId}/multiple`, formData);
  }

  /**
   * Obtener imágenes de un producto
   */
  obtenerImagenesProducto(productoId: number): Observable<ImagenProducto[]> {
    return this.http.get<ImagenProducto[]>(`${this.apiUrl}/producto/${productoId}`);
  }

  /**
   * Eliminar una imagen
   */
  eliminarImagen(imagenId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${imagenId}`);
  }

  /**
   * Establecer imagen como principal
   */
  establecerImagenPrincipal(imagenId: number): Observable<ImagenProducto> {
    return this.http.patch<ImagenProducto>(`${this.apiUrl}/${imagenId}/principal`, {});
  }
}