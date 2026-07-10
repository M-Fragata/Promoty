import { Env } from './utils/Envirolment.js';
import cors from 'cors';
import express from 'express';
export const app = express();

app.use(cors({
  origin: [Env.FRONTEND_URL],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

import { routes } from './Routes/index.js';
import { WhatsAppService } from './Services/WhatsAppService.js';

export const whatsAppService = new WhatsAppService();

app.use(express.json());
app.use(routes);



