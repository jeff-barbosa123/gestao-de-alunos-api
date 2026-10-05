import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Carrega um arquivo de massa de dados (JSON) da pasta test/fixtures.
 */
export function carregarDados(nomeArquivo) {
  const caminho = path.join(__dirname, '..', 'fixtures', nomeArquivo);
  return JSON.parse(fs.readFileSync(caminho, 'utf8'));
}
