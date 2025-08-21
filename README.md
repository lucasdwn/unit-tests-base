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
- **REST Client (VSCode Extension)** - para testar as requisições do arquivo `/http/requests.http`.

---

### 📂 Estrutura de Pastas

```
app/
├── http/
│   └── requests.http # Arquivo com requisições prontas para testar a API
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
│   │   └── express/
│   │       └── index.d.ts
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
docker run --name redis -p 6379:6379 -d redis:alpine redis-server --requirepass 123
```
ou
```bash
npm run redis-start
```

5. Iniciando o servidor
```
npm start
npm run dev
```

---

### ▶️ Testando a API com REST Client

O arquivo `/http/requests.http` contém as requisições da aplicação (login, registro, logout, CRUD de contatos).
Para executá-las diretamente no VSCode, instale a extensão:

👉 REST Client (autor: Huachao Mao)

Após instalar, basta abrir o arquivo `requests.http`, clicar em `Send Request` sobre a requisição desejada, e o VSCode mostrará a resposta no editor.

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

### 📌 Por que usar blacklist de tokens no logout?

Os JWTs são imutáveis: uma vez emitidos, não podem ser revogados no servidor até que expirem.
Isso gera um problema: mesmo que o usuário faça logout, o token ainda seria válido até seu tempo de expiração.
Para resolver isso, utilizamos uma blacklist de tokens armazenada no Redis:
- No logout (`logoutUser` em `user.controller.ts`), o token é decodificado e adicionado ao Redis até o tempo de expiração (`exp`) definido no JWT;
- O token é armazenado de forma segura: apenas seu hash SHA-256 é gravado, evitando expor o JWT completo;
- No middleware de autenticação (`authMiddleware.ts`), antes de validar o token com `verifyToken` (`jwt.ts`), verificamos se o hash do token está na blacklist;
- Se estiver, a requisição é bloqueada imediatamente.
Assim, garantimos que tokens "descartados" não possam ser reutilizados, mesmo que ainda não tenham expirado.

---

### 📌 Tipagem customizada para Express

No arquivo `src/types/express/index.d.ts`, definimos o tipo `UserPayload` e estendemos a interface `Request` do Express. Motivo:
- Permite que o TypeScript reconheça a propriedade `req.user` que é adicionada pelo middleware de autenticação (`authMiddleware.ts`);
- Evita o uso de `any` e fornece autocompletar e validação de tipos ao acessar informações do usuário autenticado dentro das rotas;
- Garante maior segurança de tipos e evita erros de runtime ao manipular dados do usuário.
***Observação sobre o `tsconfig.json`:**
Certifique-se de que a pasta `src/types` esteja incluída no `include` do `tsconfig.json`, por exemplo:
```json
{
  "compilerOptions": {
    ...
  },
  "include": ["src/**/*.ts", "src/types/**/*.d.ts"]
}

```

---

### 📌 Observações

- A função `verifyToken` (`src/utils/jwt.ts`) pode ser configurada para retornar o payload mesmo se o token estiver expirado - isso é útil no processo de logout.
- O Redis é utilizado apenas como armazenamento de tokens inválidos (blacklist).
- Em produção, recomenda-se configurar tempo de expiração para as chaves da blacklist no Redis (TTL).