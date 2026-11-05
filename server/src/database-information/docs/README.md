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

1. **Índice no contexto.** O contexto da run
   (`GET /assistant-m2m/runs/:runId/context`) traz
   `knowledge: [{ id, name, description }]` (só id, nome e descrição, ordenadas
   por criação). Vazio quando o plano do usuário não inclui a ferramenta. O nó
   *Build prompt* do `n8n.json` o renderiza no prompt do sistema como
   `<bases_de_conhecimento>` (JSON da lista).
2. **Ferramenta `database_information`.** O modelo escolhe a base pela
   `description` e, pela ferramenta genérica `executar_ferramenta`, chama
   `POST /assistant-m2m/runs/:runId/tools/execute` com
   `{ tool: "database_information", operation: "get_database_information", data: { databaseInformationId } }`
   (`data` também pode vir como JSON em texto). Retorna
   `{ id, name, description, content }` (texto integral).
3. **Handler.** `services/database-information-tool.service.ts`
   (`@AssistantToolHandlerFor('database_information')`). O `profileId` vem da
   run, nunca do modelo. Uma nova fonte de conhecimento entra como outra
   ferramenta no catálogo com o seu próprio handler; nada muda no n8n.
4. Protegido por `AssistantToolGuard` (`ASSISTANT_WORKFLOW_KEY`) e deve ser
   alcançado só pela rede `jarvis-internal`. Base de outro perfil ou id
   inexistente responde `not_found`; id ausente ou malformado,
   `validation_error`.
