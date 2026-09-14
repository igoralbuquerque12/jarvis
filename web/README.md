# Jarvis Web

Painel web do Jarvis, implementado em React e Vite. Este documento trata somente do `web`; para instalar todas as dependências da plataforma e conectar server, n8n, WhatsApp e Securo, consulte a [documentação global](../docs/README.md).

## O que existe no painel

- cadastro, login por e-mail/senha ou Google e recuperação de senha;
- dashboard com status da conexão, assinatura, eventos e resumo financeiro;
- edição de perfil e fuso horário;
- visão geral financeira e extrato de transações;
- transações recorrentes, metas, investimentos, contas, categorias e regras;
- visualização de planos;
- criação, ativação, desativação e exclusão de chaves de API;
- documentação da API pública dentro do próprio painel.

O painel não implementa um chat. A conversa com o assistente acontece pelo WhatsApp.

## Stack

- React 19
- TypeScript
- Vite 8
- React Router 7
- Recharts
- better-auth client
- ESLint

## Organização do código

```text
web/
├── public/                  # assets públicos
├── src/
│   ├── components/
│   │   ├── layout/          # shell e proteção de rotas
│   │   └── ui/              # componentes visuais reutilizáveis
│   ├── features/
│   │   ├── auth/            # login e recuperação de senha
│   │   ├── dashboard/       # início e indicadores
│   │   ├── finance/         # páginas e componentes financeiros
│   │   ├── plans/           # planos
│   │   ├── profile/         # perfil e fuso horário
│   │   └── settings/        # chaves e documentação da API
│   ├── hooks/               # carregamento e estado dos domínios
│   ├── lib/                 # cliente HTTP, auth, datas e formatação
│   ├── services/            # chamadas à API por domínio
│   ├── types/               # contratos TypeScript da API
│   ├── App.tsx              # rotas
│   ├── index.css            # tokens e estilos globais
│   └── main.tsx             # bootstrap do React
├── .env.example
├── Dockerfile
├── nginx.conf
└── vite.config.ts
```

## Dependência do backend

O web consome a API do Jarvis configurada em `VITE_API_BASE_URL`. As requisições autenticadas usam cookies e `credentials: 'include'`, então o server precisa permitir exatamente a origem do frontend em `WEB_ORIGIN`.

Em desenvolvimento, a combinação padrão é:

```dotenv
# web/.env
VITE_API_BASE_URL=http://localhost:3000

# server/.env
WEB_ORIGIN=http://localhost:5173
BETTER_AUTH_URL=http://localhost:3000
```

## Desenvolvimento local

Com o backend já configurado e rodando:

```bash
cd web
npm ci
cp .env.example .env
npm run dev
```

O Vite abre o painel em `http://localhost:5173` por padrão.

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | sim no desenvolvimento | Base HTTP da API, normalmente `http://localhost:3000`. |
| `VITE_API_URL` | sim no build Docker | Alternativa usada como build arg pelo `compose.yml`. |
| `VITE_WHATSAPP_NUMBER` | não | Número internacional somente com dígitos; habilita o botão que abre o WhatsApp com a mensagem de pareamento. |

A precedência é `VITE_API_BASE_URL`, depois `VITE_API_URL`, e por último `http://localhost:3000`.

Variáveis `VITE_*` são incorporadas ao bundle durante o build. Não coloque segredos nelas.

## Rotas

| Caminho | Tela |
|---|---|
| `/login` | autenticação |
| `/reset-password` | recuperação de senha |
| `/dashboard` | visão inicial |
| `/perfil` | perfil e fuso horário |
| `/planos` | planos |
| `/financas` | visão geral financeira |
| `/financas/transacoes` | extrato |
| `/financas/recorrencias` | recorrências |
| `/financas/metas` | metas |
| `/financas/investimentos` | investimentos |
| `/financas/configuracoes` | contas, categorias e regras |
| `/configuracoes/api` | chaves de API |
| `/configuracoes/documentacao` | documentação da API pública |

Com exceção das telas de autenticação, as rotas passam por `RequireAuth`. Caminhos desconhecidos são redirecionados para o dashboard.

## Integração com a API

- `src/lib/api.ts` centraliza o `fetch`, cookies e mensagens de erro;
- `src/services/` organiza os endpoints por domínio;
- `src/hooks/` mantém carregamento, erro e atualização das telas;
- `src/types/api.ts` representa os contratos retornados pelo server;
- `src/lib/auth-client.ts` configura o cliente do better-auth.

Ao alterar um contrato do backend, atualize os tipos, o service e as telas consumidoras. Mudanças na API pública também devem manter sincronizados o documento de [`server/src/public-api`](../server/src/public-api/docs/README.md) e a página `src/features/settings/pages/api-docs-page.tsx`.

## Scripts

```bash
npm run dev       # servidor Vite com HMR
npm run build     # type-check + build de produção
npm run lint      # ESLint
npm run preview   # serve localmente o conteúdo de dist/
```

O projeto ainda não possui uma suíte de testes automatizados própria; antes de entregar alterações, execute pelo menos `npm run lint` e `npm run build`.

## Build e Docker

O [`Dockerfile`](Dockerfile) compila os assets com Node 22 e serve o diretório `dist/` com nginx. O [`nginx.conf`](nginx.conf) possui fallback para `index.html`, necessário para as rotas do React Router funcionarem ao atualizar a página.

No build via Compose, a URL da API e o número do WhatsApp são passados como argumentos:

```bash
docker compose build web
docker compose up -d web
```

Para o deploy da plataforma completa, use o [guia de deploy](../DEPLOYMENT.md).

## Documentação relacionada

- [Projeto completo](../docs/README.md)
- [Backend](../server/README.md)
- [Arquitetura do sistema](../docs/ARCHITECTURE.md)
