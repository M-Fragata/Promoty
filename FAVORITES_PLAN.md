# Plano: Sistema de Favoritos com Autenticação

## Visão Geral

Implementar sistema de autenticação (login/cadastro) com JWT e funcionalidade de favoritos, permitindo aos usuários salvar produtos感兴趣的.

---

## 1. Schema Prisma

### User Model
```prisma
model User {
  id        String     @id @default(uuid())
  email     String     @unique
  name      String
  password  String     // Hash bcrypt
  avatar    String?
  provider  String     @default("local") // "local" | "google"
  providerId String?
  createdAt DateTime   @default(now())
  favorites Favorite[]
}
```

### Favorite Model
```prisma
model Favorite {
  id        String     @id @default(uuid())
  userId    String
  productId String
  createdAt DateTime   @default(now())
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   ProductsMl @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
}
```

---

## 2. JWT com Dados do Usuário

### Estrutura do Token
O JWT conterá todos os dados necessários do usuário:
```json
{
  "sub": "uuid-do-usuario",
  "email": "usuario@email.com",
  "name": "Nome do Usuário",
  "avatar": "url-da-foto.jpg",
  "provider": "local",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Vantagens
- ✅ Frontend acessa dados do usuário sem queries ao banco
- ✅ Dados sensíveis (senha) nunca saem do backend
- ✅ Token é self-contained (não precisa buscar user no banco a cada request)
- ✅ Menos load no PostgreSQL

### Backend - Geração do Token
```typescript
// services/AuthService.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta';

interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: string;
}

export function generateToken(user: User): string {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    provider: user.provider,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
```

### Frontend - Decodificação do Token
```typescript
// utils/auth.ts
interface UserPayload {
  sub: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: string;
  exp: number;
}

export function decodeToken(token: string): UserPayload | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Verificar se expirou
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

export function getUserFromToken(): UserPayload | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  return decodeToken(token);
}
```

---

## 3. Dependências

### Backend
```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### Frontend
Nenhuma dependência nova necessária (usa `fetch` nativo).

---

## 4. Endpoints

### Auth

| Método | Rota | Descrição | Auth? |
|--------|------|-----------|-------|
| POST | `/api/auth/register` | Criar conta | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/auth/me` | Dados do usuário (via token) | ✅ |
| POST | `/api/auth/google` | Login Google OAuth | ❌ |

### Favorites

| Método | Rota | Descrição | Auth? |
|--------|------|-----------|-------|
| GET | `/api/favorites` | Listar favoritos | ✅ |
| POST | `/api/favorites/:productId` | Adicionar favorito | ✅ |
| DELETE | `/api/favorites/:productId` | Remover favorito | ✅ |
| GET | `/api/favorites/check/:productId` | Verificar se é favorito | ❌ |

---

## 5. Fluxo de Autenticação

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Login/Cadastro │───▶│   Backend       │───▶│  JWT Token      │
│  (Frontend)     │    │   Valida dados  │    │  (contém user)  │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Tela Favoritos │◀───│  Decodifica     │◀───│  localStorage   │
│  (Mostra dados) │    │  token no frontend│   │  (salva token)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 6. Arquivos a Criar/Modificar

### Backend (Novos)
- `prisma/schema.prisma` - Adicionar User e Favorite
- `src/Middleware/authMiddleware.ts` - Verificação JWT
- `src/Services/AuthService.ts` - Geração/verificação de tokens
- `src/Routes/AuthRoutes.ts` - Rotas de autenticação
- `src/Routes/FavoritesRoutes.ts` - Rotas de favoritos
- `src/Controller/AuthController.ts` - Lógica auth
- `src/Controller/FavoritesController.ts` - Lógica favoritos

### Frontend (Novos)
- `src/contexts/AuthContext.tsx` - Estado global do usuário
- `src/utils/auth.ts` - Decodificação de token
- `src/pages/Login.tsx` - Tela de login/cadastro
- `src/pages/Favorites.tsx` - Página de favoritos
- `src/components/auth/ProtectedRoute.tsx` - Rota protegida

### Frontend (Modificar)
- `src/services/api.ts` - Headers de auth
- `src/components/product/FavoriteButton.tsx` - Integrar API
- `src/App.tsx` - Rotas e providers
- `src/components/layout/MobileNav.tsx` - Rota favoritos

---

## 7. Segurança

### Senha
- Mínimo 6 caracteres
- Hash com bcrypt (10 rounds)
- Nunca retornar senha nos responses

### JWT
- Expira em 7 dias
- Secret em variável de ambiente
- Dados do usuário criptografados no token

### Frontend
- Token salvo em `localStorage`
- Dados do usuário lidos do token (não do state global)
- Logout remove token do localStorage

---

## 8. Ordem de Implementação

1. [ ] Schema Prisma + Migration
2. [ ] AuthService (geração/verificação JWT)
3. [ ] AuthMiddleware
4. [ ] AuthController + AuthRoutes
5. [ ] FavoritesController + FavoritesRoutes
6. [ ] Frontend AuthContext
7. [ ] utils/auth.ts (decodificação)
8. [ ] Página Login/Cadastro
9. [ ] Integrar FavoriteButton
10. [ ] Página Favoritos
11. [ ] Testes e ajustes

---

## 9. Exemplo de Uso

### Login
```typescript
// Frontend
const response = await api.login({ email, password });
// response = { token: "eyJhbG..." }

localStorage.setItem('token', response.token);

// Decodificar para obter dados do usuário
const user = getUserFromToken();
// user = { sub: "uuid", email: "user@email.com", name: "Nome", ... }
```

### Favoritar
```typescript
// Frontend
const token = localStorage.getItem('token');
await fetch('/api/favorites/produto-123', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
```

### Ler Favoritos
```typescript
// Frontend
const token = localStorage.getItem('token');
const response = await fetch('/api/favorites', {
  headers: { Authorization: `Bearer ${token}` }
});
// response = { favorites: [{ productId: "...", product: {...} }] }
```
