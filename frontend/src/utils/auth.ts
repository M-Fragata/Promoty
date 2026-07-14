export interface UserPayload {
  sub: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: string;
  exp: number;
  iat: number;
}

export function decodeToken(token: string): UserPayload | null {
  try {
    // Decodificar o payload do JWT (segunda parte)
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Verificar se o token expirou
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload as UserPayload;
  } catch {
    return null;
  }
}

export function getUserFromToken(): UserPayload | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  return decodeToken(token);
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function removeToken(): void {
  localStorage.removeItem('token');
}

export function isAuthenticated(): boolean {
  const user = getUserFromToken();
  return user !== null;
}
