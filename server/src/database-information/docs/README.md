# Database information module

Bases de dados em texto que o usuário guarda em **Configurações → Conhecimento**.
Ao salvar, o Jarvis chama uma LLM (módulo `ai`) para extrair um **nome** e uma
**descrição** objetivos da base. Tudo acontece dentro da requisição, sem
processamento em segundo plano.

## Modelo e regras

- `DatabaseInformation` pertence a um `Profile` (`onDelete: Cascade`), tabela
  `database_informations`.
- `content` é `jsonb` e guarda `{ "text": "<texto enviado>" }`. O usuário só
  informa o conteúdo; `name` e `description` vêm sempre da LLM.
- Limite de `MAX_DATABASE_INFORMATION_PER_PROFILE` (10) bases por perfil e de
  20.000 caracteres por base.
- A API devolve `id`, `name`, `content` (texto), `createdAt` e `updatedAt`. A
  `description` fica só no banco.

## Endpoints (sessão)

| Rota | Faz |
|---|---|
| `GET /database-information/me` | Lista as bases do perfil. |
| `POST /database-information/me` `{ content }` | Extrai nome/descrição, grava e responde **200**. |
| `PATCH /database-information/me/:id` `{ content }` | Extrai de novo e atualiza. |
| `DELETE /database-information/me/:id` | Remove (204). |

## Extração

- Create e update chamam `AiProvider.extract` com timeout de 15 s e no máximo
  2 tentativas (`DATABASE_INFORMATION_AI_*`), porque o usuário espera a resposta.
- Se a LLM falhar, a resposta é `502` e **nada é gravado**: no update, a base
  continua com o nome e o conteúdo anteriores.
- O update com conteúdo idêntico ao salvo não chama a LLM.
- O schema Zod da extração não usa palavras-chave de tamanho (o modo `strict` da
  OpenAI pode rejeitá-las). Os limites (`name` ≤ 80, `description` ≤ 300
  caracteres) ficam no prompt e são aplicados com `trim`/`slice` no service.
- Base de outro perfil responde `404`.

## Consulta pelo assistente (n8n)

1. **Índice no contexto.** A cada mensagem, o payload enviado ao n8n traz
   `knowledge: [{ id, name, description }]` (só id, nome e descrição, ordenadas
   por criação). Vazio quando o plano do usuário não inclui a ferramenta. O n8n
   deve renderizá-lo no prompt do sistema como `<bases_de_conhecimento>`,
   por exemplo com `JSON.stringify($json.knowledge)`.
2. **Ferramenta `database_information`.** O modelo escolhe a base pela
   `description` e chama `get_database_information` com o `id` da lista.
3. **Endpoint geral de conhecimento.**
   `POST /knowledge-m2m/:profileId/database-information/execute`
   com `{ operation: "get_database_information", data: { databaseInformationId } }`.
   Retorna `{ id, name, description, content }` (texto integral). O prefixo
   `knowledge-m2m` é geral: cada fonte tem o seu próprio path (a consulta de
   audit entrará como `.../audit/execute`).
4. Protegido por `AssistantToolGuard` (`ASSISTANT_WORKFLOW_KEY`), como os demais
   M2M, e deve ser alcançado só pela rede `jarvis-internal`. Base de outro perfil
   ou id inexistente responde `not_found`; id malformado, `validation_error`.

No n8n (o `n8n.json` não está versionado neste repositório): adicione ao prompt
do sistema o bloco `<bases_de_conhecimento>` e um nó de tool que chame o path
acima, igual aos nós de `events` (`operation` fixa, `data` como JSON em texto).
