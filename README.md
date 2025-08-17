## Autenticação com JWT e Redis

Este projeto implementa autenticação baseada em **JSON Web Tokens (JWT)** em uma aplicação Node.js/TypeScript, incluindo **controle de logout com blacklist de tokens** utilizando **Redis**.

---

### 📌 Funcionalidades

- Registro e login de usuários.
- Geração de **JWT** com payload customizado.
- Validação de tokens.
- Logout com inserção de tokens em blacklist (Redis).
- Integração com Docker para execução do Redis.

---

### 🛠️ Tecnologias Utilizadas

- **Node.js** + **TypeScript**.
- **jose** - biblioteca para JWT.
- **Redis** - armazenamento da blacklist de tokens.
- **Docker** - para subir o Redis facilmente.
- **Express** - servidor HTTP.

---

### 📂 Estrutura de Pastas

```
app/
├── http/
│   └── requests.http
├── src/
│   ├── configs/
│   │   ├── comandos.sql
│   │   ├── db.ts
│   │   └── redis.ts
│   ├── controllers/
│   │   ├── contact.controller.ts
│   │   └── user.controller.ts
│   ├── middlewares/
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── validateBody.ts
│   ├── routes/
│   │   ├── contacts.routes.ts
│   │   ├── index.ts
│   │   └── users.routes.ts
│   ├── types/
│   │   ├── express/
│   │   │   └── index.d.ts
│   │   └── UserPayload.ts
│   ├── utils/
│   │   └── jwt.ts
│   └── index.ts
├── .env
├── package-lock.json
├── package.json
└── tsconfig.json
```

---

### Como executar o projeto

1. Clonando o repositório e instalando as dependências:
```bash
git clone https://github.com/arleysouza/unit-tests-base.git app
cd app
npm i
```

2. Configurando o BD PostgreSQL
- Crie um BD chamado `bdaula` no PostgreSQL (ou outro nome de sua preferência);
- Atualize o arquivo `.env` com os dados de acesso ao banco;

3. Execute os comandos SQL presentes no arquivo `src/configs/comandos.sql` para criar as tabelas necessárias;

4. Subir o Redis com Docker
```bash
docker run --name redis -p 6379:6379 -d redis redis-server --requirepass 123
```

5. Iniciando o servidor
```
npm start
npm run dev
```

---

### 🔑 Endpoints

**Registro de usuário**
``` bash
POST /users
```

**Login**
``` bash
POST /users/login
```
Resposta (exemplo):
```bash
{ "token": "eyJhbG..." }
```

**Logout**
``` bash
POST /users/logout
```
Invalida o token atual adicionando-o à blacklist no Redis.

**Rotas protegidas**

**Listar, criar, atualizar e adicionar contatos**
``` bash
GET /contacts
POST /contacts
PUT /contacts
DELETE /contacts/:id
```

---

### 📌 Observações

- A função `verifyToken` pode ser configurada para retornar o payload mesmo se o token estiver expirado, útil no processo de logout.
- O Redis é utilizado apenas como armazenamento de tokens inválidos (blacklist).
- Em produção, recomenda-se configurar tempo de expiração para as chaves da blacklist no Redis (TTL).