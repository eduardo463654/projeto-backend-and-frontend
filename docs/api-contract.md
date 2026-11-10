# Contrato de API - Laboratório FAP

## Base URL
- Desenvolvimento: http://localhost:3333
- Frontend: a URL base deve vir da variável NEXT_PUBLIC_API_URL

## Autenticação

### POST /auth/login
Entrada:
```json
{
  "email": "ana@aluno.com",
  "password": "senha123"
}
```

Sucesso (200):
```json
{
  "access_token": "jwt",
  "refresh_token": "jwt",
  "user": {
    "id": "uuid",
    "name": "Ana Souza",
    "email": "ana@aluno.com",
    "type": "aluno"
  }
}
```

Erro (401):
```json
{
  "statusCode": 401,
  "message": "Credenciais inválidas",
  "error": "Unauthorized"
}
```

## Usuários

### POST /users
Cria um usuário.

### GET /users
Lista usuários paginada.

### GET /users/:id
Busca usuário por id.

### PUT /users/:id
Atualiza dados do usuário.

### DELETE /users/:id
Remove usuário.

## Agendamentos

### GET /agendamentos
Lista agendamentos paginados com filtros por status, usuário, laboratório e data.

### POST /agendamentos
Cria novo agendamento.

### PATCH /agendamentos/:id/status
Atualiza status da solicitação.

## Laboratórios

### GET /laboratorios
Lista laboratórios.

### GET /laboratorios/:id
Detalhes do laboratório.

## Regras de contrato
- Todas as respostas em JSON.
- Paginação com page, limit e total.
- Sucesso em status 200/201.
- Erros padronizados com statusCode, message e error.
- Nenhuma senha ou token deve ser exposta em respostas públicas.
