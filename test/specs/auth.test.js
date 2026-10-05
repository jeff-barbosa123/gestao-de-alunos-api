import { expect } from 'chai';
import { api } from '../helpers/api.js';
import { carregarDados } from '../helpers/dados.js';

const { validos, invalidos } = carregarDados('login.json');

describe('POST /api/auth/login', () => {
  validos.forEach(({ cenario, email, senha, roleEsperada }) => {
    it(`deve retornar 200 e um token ao logar como ${cenario}`, async () => {
      const resposta = await api().post('/api/auth/login').send({ email, senha });

      expect(resposta.status).to.equal(200);
      expect(resposta.body).to.have.property('token').that.is.a('string');
      expect(resposta.body.usuario).to.include({ email, role: roleEsperada });
    });
  });

  invalidos.forEach(({ cenario, email, senha, statusEsperado, mensagemEsperada }) => {
    it(`deve retornar ${statusEsperado} ao logar com ${cenario}`, async () => {
      const resposta = await api().post('/api/auth/login').send({ email, senha });

      expect(resposta.status).to.equal(statusEsperado);
      expect(resposta.body.error).to.equal(mensagemEsperada);
    });
  });
});
