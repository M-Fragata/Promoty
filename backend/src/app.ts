import { Env } from './utils/Envirolment.js';

import express from 'express';
import cors from 'cors';

import { routes } from './Routes/index.js';
import { WhatsAppService } from './Services/WhatsAppService.js';

export const whatsAppService = new WhatsAppService();

export const app = express();

app.use(cors({
  origin: [Env.FRONTEND_URL],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(routes);



