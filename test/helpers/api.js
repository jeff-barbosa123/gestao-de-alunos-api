import 'dotenv/config';
import request from 'supertest';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Cliente SuperTest apontando para a API definida em BASE_URL (.env).
 */
export const api = () => request(BASE_URL);

/**
 * Gera um sufixo único para evitar conflito de e-mail/matrícula entre execuções.
 */
export function sufixoUnico() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
