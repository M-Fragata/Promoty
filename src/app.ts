import express from 'express';
import dotenv from 'dotenv';

import { routes } from './Routes/index.js';

dotenv.config();

export const app = express();

app.use(express.json());
app.use(routes);

