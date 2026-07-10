import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import { routes } from './Routes/index.js';
import { WhatsAppService } from './Services/WhatsAppService.js';

export const whatsAppService = new WhatsAppService();

export const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(routes);



