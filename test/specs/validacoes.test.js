import { expect } from 'chai';
import { api, sufixoUnico } from '../helpers/api.js';
import { obterTokenAdmin, obterTokenAluno } from '../helpers/autenticacao.js';
import { carregarDados } from '../helpers/dados.js';

const cadastrosInvalidos = carregarDados('cadastroAlunoInvalido.json');
const entregasInvalidas = carregarDados('entregaTrabalhoInvalida.json');

describe('Validações de cadastro de aluno e entrega de trabalho', () => {
  let tokenAdmin;
  let tokenAluno;
  let alunoId;

  before(async () => {
    tokenAdmin = await obterTokenAdmin();

    // Pré-condição: aluno novo, matriculado apenas em Matemática
    const sufixo = sufixoUnico();
    const aluno = {
      nome: 'Aluno Validação',
      email: `aluno.validacao.${sufixo}@example.com`,
      matricula: `V${sufixo}`,
      senha: 'validacao123',
    };

    const cadastro = await api()
      .post('/api/admin/alunos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(aluno);
    expect(cadastro.status).to.equal(201);
    alunoId = cadastro.body.id;

    const matricula = await api()
      .post('/api/admin/disciplinas/disciplina-matematica/matriculas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ alunoId });
    expect(matricula.status).to.equal(201);

    ({ token: tokenAluno } = await obterTokenAluno(aluno.email, aluno.senha));
  });

  describe('POST /api/admin/alunos - dados inválidos', () => {
    cadastrosInvalidos.forEach(({ cenario, aluno, statusEsperado, mensagemEsperada }) => {
      it(`deve retornar ${statusEsperado} ao cadastrar aluno ${cenario}`, async () => {
        const resposta = await api()
          .post('/api/admin/alunos')
          .set('Authorization', `Bearer ${tokenAdmin}`)
          .send(aluno);

        expect(resposta.status).to.equal(statusEsperado);
        expect(resposta.body.error).to.equal(mensagemEsperada);
      });
    });

    it('deve retornar 403 quando um aluno tentar cadastrar outro aluno', async () => {
      const resposta = await api()
        .post('/api/admin/alunos')
        .set('Authorization', `Bearer ${tokenAluno}`)
        .send({ nome: 'Intruso', email: `intruso.${sufixoUnico()}@example.com`, matricula: `I${sufixoUnico()}`, senha: '123456' });

      expect(resposta.status).to.equal(403);
      expect(resposta.body.error).to.equal('Você não tem permissão para acessar este recurso.');
    });
  });

  describe('POST /api/alunos/:alunoId/trabalhos - dados inválidos', () => {
    entregasInvalidas.forEach(({ cenario, disciplinaId, trabalho, statusEsperado, mensagemEsperada }) => {
      it(`deve retornar ${statusEsperado} ao registrar trabalho ${cenario}`, async () => {
        const corpo = disciplinaId ? { disciplinaId, ...trabalho } : { ...trabalho };

        const resposta = await api()
          .post(`/api/alunos/${alunoId}/trabalhos`)
          .set('Authorization', `Bearer ${tokenAluno}`)
          .send(corpo);

        expect(resposta.status).to.equal(statusEsperado);
        expect(resposta.body.error).to.equal(mensagemEsperada);
      });
    });

    it('deve retornar 403 quando o aluno tentar registrar trabalho em nome de outro aluno', async () => {
      const resposta = await api()
        .post('/api/alunos/aluno-ana-souza/trabalhos')
        .set('Authorization', `Bearer ${tokenAluno}`)
        .send({ disciplinaId: 'disciplina-matematica', titulo: 'Trabalho alheio' });

      expect(resposta.status).to.equal(403);
      expect(resposta.body.error).to.equal('Você só pode acessar os seus próprios dados.');
    });

    it('deve retornar 401 ao registrar trabalho sem token', async () => {
      const resposta = await api()
        .post(`/api/alunos/${alunoId}/trabalhos`)
        .send({ disciplinaId: 'disciplina-matematica', titulo: 'Sem token' });

      expect(resposta.status).to.equal(401);
      expect(resposta.body.error).to.equal('Token de autenticação não informado.');
    });
  });
});
