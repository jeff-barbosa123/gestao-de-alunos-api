import 'dotenv/config';
import { expect } from 'chai';
import { api } from './api.js';

async function login(email, senha) {
  const resposta = await api()
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send({ email, senha });

  expect(resposta.status, `Falha no login de ${email}: ${JSON.stringify(resposta.body)}`).to.equal(200);
  expect(resposta.body).to.have.property('token');

  return resposta.body;
}

/**
 * Faz login como administrador usando as credenciais do .env e retorna o token JWT.
 */
export async function obterTokenAdmin() {
  const { token } = await login(process.env.ADMIN_EMAIL, process.env.ADMIN_SENHA);
  return token;
}

/**
 * Faz login como aluno (usuário) e retorna o token JWT e o id do aluno autenticado.
 */
export async function obterTokenAluno(email, senha) {
  const { token, usuario } = await login(email, senha);
  return { token, alunoId: usuario.id };
}
