## Segurança no Desenvolvimento de Aplicações

Este repositório contém o código utilizado na aula sobre vulnerabilidades do tipo **Broken Access Control**, com foco na identificação de falhas de autorização e estratégias eficazes para sua mitigação.

### Objetivos

O principal objetivo deste projeto é demonstrar, na prática, como falhas no controle de acesso podem ser exploradas e como evitá-las. Os tópicos abordados são:

1. Conceitos de autenticação e autorização;
2. Broken Access Control e sua posição no OWASP Top 10;
3. Exemplos de falhas comuns, como:
   - IDOR (Insecure Direct Object Reference);
   - Escalada de privilégios vertical;
4. Estratégias de mitigação:
   - Verificações no lado do servidor;
   - Princípio do menor privilégio;
   - Uso de middlewares de autorização.

### Como executar o projeto

1. Clonando o repositório e instalando as dependências:
```bash
git clone http://github.com/arleysouza/broken-access-control.git server
cd server
npm i
```

2. Configurando o BD PostgreSQL
- Crie um BD chamado `bdaula` no PostgreSQL (ou outro nome de sua preferência);
- Atualize o arquivo `.env` com os dados de acesso ao banco;

3. Execute os comandos SQL presentes no arquivo `src/comandos.sql` para criar as tabelas necessárias;

4. Adicione a seguinte linha no arquivo `C:\Windows\System32\drivers\etc\hosts`:
```bash
127.0.0.1   vitima.local
```

5. Iniciando o servidor
```
npm start
npm run dev
```

### Observações

- O projeto utiliza Express.js, TypeScript, PostgreSQL e cookies de sessão;
- As verificações de autenticação e autorização foram implementadas via middlewares localizados em `src/middlewares`;
- Algumas rotas foram propositalmente deixadas vulneráveis para fins didáticos;
- Os exercícios demonstram como usuários não autorizados podem acessar ou modificar dados de outros usuários se não houver validações adequadas no backend;
- Nunca aplique essas práticas em ambientes reais sem os devidos controles de segurança.