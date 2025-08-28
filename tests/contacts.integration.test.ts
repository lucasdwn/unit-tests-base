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

describe('Testes de Integração - Contatos', () => {
  let authToken: string;
  let userId: number;

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

    // Cria um usuário e faz login para obter o token
    await request(app)
      .post('/users')
      .send({
        username: 'contactuser',
        password: 'password123'
      });

    const loginResponse = await request(app)
      .post('/users/login')
      .send({
        username: 'contactuser',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
    userId = loginResponse.body.data.user.id;
  });

  describe('POST /contacts - Criar contato', () => {
    it('deve criar um contato com dados válidos', async () => {
      const contactData = {
        name: 'João Silva',
        phone: '(11)99999-9999'
      };

      const response = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          contact: {
            name: 'João Silva',
            phone: '(11)99999-9999',
            user_id: userId
          }
        }
      });
      expect(response.body.data.contact.id).toBeDefined();
    });

    it('deve falhar ao criar contato sem autenticação', async () => {
      const contactData = {
        name: 'João Silva',
        phone: '(11)99999-9999'
      };

      const response = await request(app)
        .post('/contacts')
        .send(contactData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false
      });
    });

    it('deve falhar ao criar contato com nome muito curto', async () => {
      const contactData = {
        name: 'J',
        phone: '(11)99999-9999'
      };

      const response = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Erro de validação dos campos'
      });
      expect(response.body.data).toBeDefined();
      expect(response.body.data.some((error: string) => error.includes('name'))).toBe(true);
    });

    it('deve falhar ao criar contato com telefone inválido', async () => {
      const contactData = {
        name: 'João Silva',
        phone: '123'
      };

      const response = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Erro de validação dos campos'
      });
      expect(response.body.data).toBeDefined();
      expect(response.body.data.some((error: string) => error.includes('phone'))).toBe(true);
    });

    it('deve aceitar diferentes formatos de telefone válidos', async () => {
      const phoneFormats = [
        '(11)99999-9999',
        '1199999-9999',
        '(11)9999-9999',
        '119999-9999'
      ];

      for (let i = 0; i < phoneFormats.length; i++) {
        const contactData = {
          name: `Contact ${i}`,
          phone: phoneFormats[i]
        };

        const response = await request(app)
          .post('/contacts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(contactData)
          .expect(201);

        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('GET /contacts - Listar contatos', () => {
    beforeEach(async () => {
      // Cria alguns contatos para teste
      const contacts = [
        { name: 'João Silva', phone: '(11)99999-9999' },
        { name: 'Maria Santos', phone: '(11)88888-8888' },
        { name: 'Pedro Costa', phone: '(11)77777-7777' }
      ];

      for (const contact of contacts) {
        await request(app)
          .post('/contacts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(contact);
      }
    });

    it('deve listar todos os contatos do usuário autenticado', async () => {
      const response = await request(app)
        .get('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true
      });
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(3);
      
      // Verifica se todos os contatos pertencem ao usuário
      response.body.data.forEach((contact: any) => {
        expect(contact.user_id).toBe(userId);
      });
    });

    it('deve retornar lista vazia para usuário sem contatos', async () => {
      // Cria outro usuário
      await request(app)
        .post('/users')
        .send({
          username: 'emptyuser',
          password: 'password123'
        });

      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          username: 'emptyuser',
          password: 'password123'
        });

      const emptyUserToken = loginResponse.body.data.token;

      const response = await request(app)
        .get('/contacts')
        .set('Authorization', `Bearer ${emptyUserToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: []
      });
    });

    it('deve falhar ao listar contatos sem autenticação', async () => {
      const response = await request(app)
        .get('/contacts')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false
      });
    });
  });

  describe('PUT /contacts/:id - Atualizar contato', () => {
    let contactId: number;

    beforeEach(async () => {
      // Cria um contato para atualizar
      const createResponse = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Name',
          phone: '(11)99999-9999'
        });

      contactId = createResponse.body.data.contact.id;
    });

    it('deve atualizar um contato com dados válidos', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '(11)88888-8888'
      };

      const response = await request(app)
        .put(`/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: contactId,
          name: 'Updated Name',
          phone: '(11)88888-8888',
          user_id: userId
        }
      });
    });

    it('deve falhar ao atualizar contato inexistente', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '(11)88888-8888'
      };

      const response = await request(app)
        .put('/contacts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Contato não encontrado'
      });
    });

    it('deve falhar ao atualizar contato de outro usuário', async () => {
      // Cria outro usuário
      await request(app)
        .post('/users')
        .send({
          username: 'otheruser',
          password: 'password123'
        });

      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          username: 'otheruser',
          password: 'password123'
        });

      const otherUserToken = loginResponse.body.data.token;

      const updateData = {
        name: 'Hacked Name',
        phone: '(11)88888-8888'
      };

      const response = await request(app)
        .put(`/contacts/${contactId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Contato não encontrado'
      });
    });

    it('deve falhar ao atualizar contato sem autenticação', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '(11)88888-8888'
      };

      const response = await request(app)
        .put(`/contacts/${contactId}`)
        .send(updateData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false
      });
    });

    it('deve falhar ao atualizar contato com dados inválidos', async () => {
      const updateData = {
        name: 'U',
        phone: 'invalid'
      };

      const response = await request(app)
        .put(`/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false
      });
    });
  });

  describe('DELETE /contacts/:id - Deletar contato', () => {
    let contactId: number;

    beforeEach(async () => {
      // Cria um contato para deletar
      const createResponse = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'To Delete',
          phone: '(11)99999-9999'
        });

      contactId = createResponse.body.data.contact.id;
    });

    it('deve deletar um contato existente', async () => {
      const response = await request(app)
        .delete(`/contacts/${contactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: 'Contato deletado com sucesso'
        }
      });

      // Verifica se o contato foi realmente deletado
      const listResponse = await request(app)
        .get('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body.data).toHaveLength(0);
    });

    it('deve falhar ao deletar contato inexistente', async () => {
      const response = await request(app)
        .delete('/contacts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Contato não encontrado'
      });
    });

    it('deve falhar ao deletar contato de outro usuário', async () => {
      // Cria outro usuário
      await request(app)
        .post('/users')
        .send({
          username: 'otheruser2',
          password: 'password123'
        });

      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          username: 'otheruser2',
          password: 'password123'
        });

      const otherUserToken = loginResponse.body.data.token;

      const response = await request(app)
        .delete(`/contacts/${contactId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Contato não encontrado'
      });
    });

    it('deve falhar ao deletar contato sem autenticação', async () => {
      const response = await request(app)
        .delete(`/contacts/${contactId}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false
      });
    });
  });

  describe('Isolamento entre usuários', () => {
    it('usuários diferentes devem ter contatos isolados', async () => {
      // Cria contato para o primeiro usuário
      await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'User1 Contact',
          phone: '(11)99999-9999'
        });

      // Cria segundo usuário
      await request(app)
        .post('/users')
        .send({
          username: 'user2',
          password: 'password123'
        });

      const user2LoginResponse = await request(app)
        .post('/users/login')
        .send({
          username: 'user2',
          password: 'password123'
        });

      const user2Token = user2LoginResponse.body.data.token;

      // Cria contato para o segundo usuário
      await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'User2 Contact',
          phone: '(11)88888-8888'
        });

      // Verifica que cada usuário vê apenas seus próprios contatos
      const user1ContactsResponse = await request(app)
        .get('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const user2ContactsResponse = await request(app)
        .get('/contacts')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user1ContactsResponse.body.data).toHaveLength(1);
      expect(user1ContactsResponse.body.data[0].name).toBe('User1 Contact');

      expect(user2ContactsResponse.body.data).toHaveLength(1);
      expect(user2ContactsResponse.body.data[0].name).toBe('User2 Contact');
    });
  });
});
