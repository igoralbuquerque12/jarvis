# Public API module

Endpoints públicos do Jarvis, pensados para integração com sistemas externos.
Todas as rotas vivem sob `/v1`, são protegidas por `ApiKeyGuard` (ver
`api-keys/docs/README.md`) e agem **sempre em nome do dono da chave** — o
cliente nunca informa `profileId`, `jid` ou telefone.

Ao contrário dos `/events-m2m/*` e `/finance-m2m/*` (só na rede interna), estas
rotas são feitas para serem expostas na internet junto com o restante da API.

## Autenticação

```
Authorization: Bearer jrv_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Alternativa: header `x-api-key: jrv_...`. Sem chave, chave inválida ou inativa
→ `401`.

## Endpoints

### `POST /v1/messages`

Faz o Jarvis enviar uma mensagem de texto para o WhatsApp do próprio dono da
chave. Útil para alertas de deploy, notificações de scripts, integrações com
n8n/Zapier, etc.

```json
{ "message": "Deploy finalizado com sucesso ✅" }
```

- `message`: obrigatório, texto de 1 a 4000 caracteres (é enviado sem espaços
  nas pontas).

Resposta `201`:

```json
{ "sent": true, "sentAt": "2026-09-10T15:04:05.000Z" }
```

Erros:

| Status | Quando                                                        |
| ------ | ------------------------------------------------------------- |
| `400`  | corpo inválido (campo faltando, vazio, longo demais ou extra) |
| `401`  | chave ausente, inválida ou inativa                            |
| `429`  | mais de uma requisição com a mesma chave em um minuto          |
| `409`  | o perfil ainda não vinculou um número de WhatsApp             |
| `503`  | o WhatsApp do Jarvis está desconectado no momento             |

Exemplo:

```bash
curl -X POST https://<host>/v1/messages \
  -H "Authorization: Bearer jrv_..." \
  -H "Content-Type: application/json" \
  -d '{"message":"Olá do meu script!"}'
```

## Como adicionar um novo endpoint público

1. Crie o DTO em `dto/` (class-validator; o `ValidationPipe` global rejeita
   campos extras).
2. Coloque a regra de negócio em `services/public-api.service.ts` (ou em um
   novo service se o assunto for outro).
3. Adicione a rota em `controllers/public-api.controller.ts` — o guard já está
   aplicado na classe, basta receber `@ApiKeyProfile() profile`.
4. Documente aqui e na página de documentação do front
   (`web/src/features/settings/pages/api-docs-page.tsx`).

## Estrutura

```
public-api/
├── public-api.module.ts                  # importa ApiKeysModule + RedisModule + WhatsappModule
├── controllers/public-api.controller.ts  # rotas /v1/*
├── dto/send-self-message.dto.ts
└── services/public-api.service.ts
```
