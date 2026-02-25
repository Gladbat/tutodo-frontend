import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  numeroWhatsapp: string;
  rol: string; // 'USER' o 'ADMIN'
  usuarioId?: number; // Alias para compatibilidad
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
  rol: string; // 'USER' o 'ADMIN'
  email: string;
  nombre: string;
  apellido: string;
  numeroWhatsapp: string;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public isLoggedIn(): boolean {
    return this.currentUserValue !== null;
  }

  public getCurrentUser(): User | null {
    return this.currentUserValue;
  }

  public isAdmin(): boolean {
    return this.currentUserValue?.rol === 'ADMIN';
  }

  public getUserRole(): string | null {
    return this.currentUserValue?.rol || null;
  }

  login(email: string, contrasena: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, contrasena })
      .pipe(
        tap(response => {
          // Convertir AuthResponse a User
          const user: User = {
            id: response.usuarioId,
            usuarioId: response.usuarioId,
            email: response.email,
            nombre: response.nombre,
            apellido: response.apellido,
            numeroWhatsapp: response.numeroWhatsapp,
            rol: response.rol
          };
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        })
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        tap(response => {
          // Convertir AuthResponse a User
          const user: User = {
            id: response.usuarioId,
            usuarioId: response.usuarioId,
            email: response.email,
            nombre: response.nombre,
            apellido: response.apellido,
            numeroWhatsapp: response.numeroWhatsapp,
            rol: response.rol
          };
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  updateUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Métodos para recuperación de contraseña
  verificarEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verificar-email`, { email });
  }

  verificarRespuesta(email: string, respuesta: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verificar-respuesta`, { email, respuesta });
  }

  restablecerContrasena(email: string, nuevaContrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/restablecer-contrasena`, { email, nuevaContrasena });
  }
}
