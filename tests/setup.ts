import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente de teste
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Configurações globais para os testes
beforeAll(async () => {
  // Aguarda um tempo para garantir que os containers estejam prontos
  await new Promise(resolve => setTimeout(resolve, 2000));
});

afterAll(async () => {
  // Cleanup global após todos os testes
  await new Promise(resolve => setTimeout(resolve, 1000));
});
