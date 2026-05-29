import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

import { routes } from './Routes/index.js';
import { WhatsAppService } from './Services/WhatsAppService.js';

export const whatsAppService = new WhatsAppService();

export const app = express();

app.use(express.json());
app.use(routes);

