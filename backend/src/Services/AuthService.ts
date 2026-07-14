import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../Database/Prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'promoty-default-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: string;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {

  register = async (input: RegisterInput) => {
    const { email, name, password } = input;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        provider: 'local'
      }
    });

    // Gerar token
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider
      }
    };
  };

  login = async (input: LoginInput) => {
    const { email, password } = input;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Email ou senha inválidos');
    }

    // Gerar token
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider
      }
    };
  };

  getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  };

  generateToken = (user: { id: string; email: string; name: string; avatar: string | null; provider: string }): string => {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  };

  verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  };
}

export const authService = new AuthService();
