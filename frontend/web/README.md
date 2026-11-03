# laboratorio_Informatica
Sistema de agendamentos do laboratório de redes e informática.

# LabFlow — Frontend de Gestão de Laboratórios

Aplicação Next.js para gerenciamento e agendamento de laboratórios de informática e redes, com dashboards por perfil, autenticação simulada, validação com Zod, UI em Tailwind e dados mockados com TanStack Query.

## Stack

- Next.js 16 + App Router
- TypeScript strict
- Tailwind CSS
- shadcn-inspired component primitives
- React Hook Form + Zod
- TanStack Query
- Zustand
- date-fns
- Framer Motion
- Recharts
- next-themes

## Como rodar

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Estrutura principal

```bash
src/
  app/
    login/
    cadastro/
    aluno/
    professor/
    admin/
    monitor/
    acesso-negado/
  components/
    ui/
    layout/
  lib/
    mock-data.ts
    schemas.ts
    services.ts
    types.ts
    utils.ts
  store/
    session-store.ts
```

## Dados mockados e serviços

Os mocks estão em `src/lib/mock-data.ts` e a camada de acesso em `src/lib/services.ts`. O fluxo foi estruturado para permitir troca simples por API real:

1. Crie um serviço real em `src/lib/services.ts` ou em `src/services`.
2. Mantenha as mesmas interfaces de `src/lib/types.ts`.
3. Troque a implementação de `fetchAgendamentos`, `fetchUsuarios`, `fetchLaboratorios` e `fetchNotificacoes`.
4. Os formulários e dashboards continuam funcionando sem mudanças de contrato.

## Perfis implementados

- aluno
- professor
- admin
- monitor

Cada perfil possui rota própria e navegação específica via sidebar.

## Regras de negócio refletidas

- status inicial pendente
- RA obrigatório para aluno
- fluxo de monitor fora do expediente
- diferenciação entre laboratórios de redes e informática
- dashboard analítico para admin
- listagem e aprovações por perfil
- dark mode
- responsividade básica para desktop e mobile

## Observações

- A autenticação é simulada via cookie de sessão (`lab_session`).
- O middleware em `src/middleware.ts` redireciona para `/login` ou `/acesso-negado`.
- As telas foram deixadas navegáveis com dados realistas e estados de carregamento e vazios configurados.
