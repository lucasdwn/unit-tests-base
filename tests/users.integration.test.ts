import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import router from '../src/routes';
import { errorHandler } from '../src/middlewares/errorHandler';
import db from '../src/configs/db';
import redisClient from '../src/configs/redis';

// Configuração da aplicação para testes
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/', router);
app.use(errorHandler);

describe('Testes de Integração - Usuários', () => {
  beforeAll(async () => {
    // Limpa o banco de dados antes dos testes
    await db.query('DELETE FROM contacts');
    await db.query('DELETE FROM users');
  });

  afterAll(async () => {
    // Limpa o banco de dados após os testes
    await db.query('DELETE FROM contacts');
    await db.query('DELETE FROM users');
    await db.end();
    await redisClient.quit();
  });

  beforeEach(async () => {
    // Limpa o banco entre cada teste
    await db.query('DELETE FROM contacts');
    await db.query('DELETE FROM users');
    // Limpa o Redis
    await redisClient.flushall();
  });

  describe('POST /users - Registro de usuário', () => {
    it('deve criar um usuário com dados válidos', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: 'Usuário criado com sucesso.'
        }
      });
    });

    it('deve falhar ao criar usuário com username muito curto', async () => {
      const userData = {
        username: 'ab',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Erro de validação dos campos'
      });
      expect(response.body.data).toBeDefined();
      expect(response.body.data.some((error: string) => error.includes('username'))).toBe(true);
    });

    it('deve falhar ao criar usuário com senha muito curta', async () => {
      const userData = {
        username: 'testuser',
        password: '123'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Erro de validação dos campos'
      });
      expect(response.body.data).toBeDefined();
      expect(response.body.data.some((error: string) => error.includes('password'))).toBe(true);
    });

    it('deve falhar ao criar usuário com username duplicado', async () => {
      const userData = {
        username: 'duplicateuser',
        password: 'password123'
      };

      // Primeiro usuário
      await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      // Tentativa de criar usuário duplicado
      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false
      });
    });

    it('deve falhar ao criar usuário sem dados obrigatórios', async () => {
      const response = await request(app)
        .post('/users')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false
      });
    });
  });

  describe('POST /users/login - Login de usuário', () => {
    beforeEach(async () => {
      // Cria um usuário para os testes de login
      await request(app)
        .post('/users')
        .send({
          username: 'loginuser',
          password: 'password123'
        });
    });

    it('deve fazer login com credenciais válidas', async () => {
      const loginData = {
        username: 'loginuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: 'Login realizado com sucesso.',
          user: {
            username: 'loginuser'
          }
        }
      });
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.id).toBeDefined();
    });

    it('deve falhar com username inexistente', async () => {
      const loginData = {
        username: 'nonexistentuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Credenciais inválidas.'
      });
    });

    it('deve falhar com senha incorreta', async () => {
      const loginData = {
        username: 'loginuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Credenciais inválidas.'
      });
    });

    it('deve falhar sem dados obrigatórios', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false
      });
    });
  });

  describe('POST /users/logout - Logout de usuário', () => {
    let authToken: string;

    beforeEach(async () => {
      // Cria e faz login de um usuário para os testes de logout
      await request(app)
        .post('/users')
        .send({
          username: 'logoutuser',
          password: 'password123'
        });

      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          username: 'logoutuser',
          password: 'password123'
        });

      authToken = loginResponse.body.data.token;
    });

    it('deve fazer logout com token válido', async () => {
      const response = await request(app)
        .post('/users/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: 'Logout realizado com sucesso. Token invalidado.'
        }
      });
    });

    it('deve falhar logout sem token', async () => {
      const response = await request(app)
        .post('/users/logout')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Token não fornecido'
      });
    });

    it('deve falhar logout com token inválido', async () => {
      const response = await request(app)
        .post('/users/logout')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false
      });
    });

    it('deve invalidar o token após logout', async () => {
      // Faz logout
      await request(app)
        .post('/users/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Tenta acessar rota protegida com token invalidado
      const response = await request(app)
        .get('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false
      });
    });
  });
});
