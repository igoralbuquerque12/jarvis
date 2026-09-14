# API keys module

Este módulo permite que um usuário crie chaves de API para usar o Jarvis como
serviço a partir de outros sistemas (scripts, n8n, Zapier, cron jobs, etc.).
Ele cuida apenas do **ciclo de vida das chaves** e da **autenticação por
chave**. Os endpoints públicos que usam essas chaves ficam no módulo
`public-api`.

## Modelo e regras

- `ApiKey` pertence a um `Profile` (`onDelete: Cascade`).
- O segredo tem o formato `jrv_<32 caracteres base64url>` e é gerado com
  `randomBytes`. Ele é mostrado **uma única vez**, na resposta da criação.
- O banco guarda somente o `hash` (SHA-256 do segredo, coluna `@unique`) e o
  `prefix` (os 12 primeiros caracteres, ex.: `jrv_a1b2c3d4`) para o usuário
  reconhecer a chave na interface.
- `active` permite pausar uma chave sem apagá-la. `lastUsedAt` é atualizado a
  cada requisição autenticada (best-effort, sem bloquear a chamada).
- Limite de `MAX_API_KEYS_PER_PROFILE` (10) chaves por perfil.

## Autenticação por chave

`ApiKeyGuard` lê a chave de `Authorization: Bearer <chave>` (preferido) ou do
header `x-api-key`, calcula o hash, busca a `ApiKey` com o `Profile` dono e
recusa com `401` quando:

- nenhuma chave foi enviada;
- a chave não tem o formato esperado, não existe ou está inativa;
- o perfil dono está inativo.

Ao passar, o guard grava o perfil em `request.apiKeyProfile`. Nos handlers use
o decorator `@ApiKeyProfile()` para recebê-lo já tipado como `Profile`.

```ts
@Controller('v1')
@UseGuards(ApiKeyGuard)
export class PublicApiController {
  @Post('messages')
  send(@ApiKeyProfile() profile: Profile, @Body() body: SendSelfMessageDto) {}
}
```

## Endpoints autenticados (web)

Exigem sessão do better-auth (cookie) e operam sempre sobre o perfil do usuário
logado. A resposta nunca inclui o `hash`.

### `GET /api-keys/me`

Lista as chaves do perfil, mais recentes primeiro. Cada item traz `id`,
`name`, `prefix`, `active`, `lastUsedAt` e `createdAt`.

### `POST /api-keys/me`

```json
{ "name": "Automação n8n" }
```

Cria uma chave e responde com os campos da listagem **mais `secret`**, o valor
completo da chave. Guarde-o: ele não pode ser recuperado depois. Responde `400`
quando o limite de chaves foi atingido.

### `PATCH /api-keys/me/:id`

```json
{ "name": "Novo nome", "active": false }
```

Ambos os campos são opcionais. Responde `404` se a chave não pertencer ao
perfil da sessão.

### `DELETE /api-keys/me/:id`

Apaga a chave definitivamente. Responde `204`; `404` se não pertencer ao perfil.

## Estrutura

```
api-keys/
├── api-keys.module.ts
├── constants/api-keys.constant.ts        # limite por perfil
├── controllers/api-keys.controller.ts    # CRUD com sessão
├── decorators/api-key-profile.decorator.ts
├── dto/                                  # create / update
├── entities/api-key.view.ts              # o que sai para o cliente
├── guards/api-key.guard.ts               # autenticação por chave
├── services/api-keys.service.ts          # regras + Prisma
├── types/express.d.ts                    # request.apiKeyProfile
└── utils/                                # gerar/hashear e extrair a chave
```
