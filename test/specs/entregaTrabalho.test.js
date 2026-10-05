import { expect } from 'chai';
import { api, sufixoUnico } from '../helpers/api.js';
import { obterTokenAdmin, obterTokenAluno } from '../helpers/autenticacao.js';
import { carregarDados } from '../helpers/dados.js';

const cenarios = carregarDados('entregaTrabalho.json');

describe('Fluxo: admin cadastra aluno e aluno registra entrega de trabalho', () => {
  let tokenAdmin;

  before(async () => {
    tokenAdmin = await obterTokenAdmin();
  });

  it('deve logar como administrador e receber um token JWT', () => {
    expect(tokenAdmin).to.be.a('string').and.not.be.empty;
  });

  cenarios.forEach((dados) => {
    describe(`Cenário: ${dados.cenario}`, () => {
      const sufixo = sufixoUnico();
      const aluno = {
        nome: dados.aluno.nome,
        email: `${dados.aluno.emailPrefixo}.${sufixo}@example.com`,
        matricula: `M${sufixo}`,
        senha: dados.aluno.senha,
      };

      let alunoId;
      let tokenAluno;

      it('admin deve cadastrar o aluno', async () => {
        const resposta = await api()
          .post('/api/admin/alunos')
          .set('Authorization', `Bearer ${tokenAdmin}`)
          .send(aluno);

        expect(resposta.status).to.equal(201);
        expect(resposta.body).to.include({
          nome: aluno.nome,
          email: aluno.email,
          matricula: aluno.matricula,
          role: 'aluno',
        });
        expect(resposta.body).to.have.property('id').that.is.a('string');
        expect(resposta.body).to.not.have.property('senha');

        alunoId = resposta.body.id;
      });

      it('admin deve matricular o aluno na disciplina', async () => {
        const resposta = await api()
          .post(`/api/admin/disciplinas/${dados.disciplinaId}/matriculas`)
          .set('Authorization', `Bearer ${tokenAdmin}`)
          .send({ alunoId });

        expect(resposta.status).to.equal(201);
        expect(resposta.body).to.include({ alunoId, disciplinaId: dados.disciplinaId });
      });

      it('deve logar como o aluno cadastrado', async () => {
        const login = await obterTokenAluno(aluno.email, aluno.senha);

        expect(login.token).to.be.a('string').and.not.be.empty;
        expect(login.alunoId).to.equal(alunoId);

        tokenAluno = login.token;
      });

      it('aluno deve registrar a entrega do trabalho', async () => {
        const resposta = await api()
          .post(`/api/alunos/${alunoId}/trabalhos`)
          .set('Authorization', `Bearer ${tokenAluno}`)
          .send({ disciplinaId: dados.disciplinaId, ...dados.trabalho });

        expect(resposta.status).to.equal(201);
        expect(resposta.body).to.include({
          alunoId,
          disciplinaId: dados.disciplinaId,
          titulo: dados.trabalho.titulo,
          descricao: dados.trabalho.descricao,
          status: 'entregue',
        });
        expect(resposta.body).to.have.property('id');
      });

      it('aluno deve visualizar o trabalho entregue na sua lista', async () => {
        const resposta = await api()
          .get(`/api/alunos/${alunoId}/trabalhos`)
          .set('Authorization', `Bearer ${tokenAluno}`);

        expect(resposta.status).to.equal(200);
        expect(resposta.body.map((t) => t.titulo)).to.include(dados.trabalho.titulo);
      });
    });
  });
});
