# Database information module

Bases de dados em texto que o usuário guarda em **Configurações → Conhecimento**.
Ao salvar, o Jarvis chama uma LLM (módulo `ai`) para extrair um **nome** e uma
**descrição** objetivos da base, dentro da requisição. Depois de gravada, a
base é **indexada em segundo plano** para a busca do assistente (RAG): o texto
vira trechos com embeddings no Postgres (pgvector).

## Modelo e regras

- `DatabaseInformation` pertence a um `Profile` (`onDelete: Cascade`), tabela
  `database_informations`.
- `content` é `jsonb` e guarda `{ "text": "<texto enviado>" }`. O usuário só
  informa o conteúdo; `name` e `description` vêm sempre da LLM.
- Limite de `MAX_DATABASE_INFORMATION_PER_PROFILE` (10) bases por perfil e de
  20.000 caracteres por base.
- Colunas da indexação: `contentHash` (SHA-256 do texto), `indexStatus`
  (`PENDING | PROCESSING | READY | FAILED`), `indexError`, `indexAttempts`,
  `indexStartedAt`, `indexedAt` e `chunkCount`.
- `KnowledgeChunk` (tabela `knowledge_chunks`): um trecho pesquisável, com
  `content`, `position`, `embedding vector(1536)` e `embeddingModel`. Tem chave
  estrangeira com `ON DELETE CASCADE` para a base e para o perfil. É gravado e
  lido com SQL cru (a coluna de vetor é `Unsupported` no Prisma).
- `KnowledgeSearchLog` (tabela `knowledge_search_logs`): cada busca do
  assistente (`profileId`, `runId`, `query` e os ids/scores dos trechos
  devolvidos), para calibrar a busca.
- A API devolve `id`, `name`, `content` (texto), `indexStatus`, `indexedAt`,
  `chunkCount`, `createdAt` e `updatedAt`. A `description` e o `indexError`
  ficam só no banco.
- As constantes do módulo (extração, chunking, indexação e busca) ficam em
  `constants/database-information.constant.ts`.

## Endpoints (sessão)

| Rota | Faz |
|---|---|
| `GET /database-information/me` | Lista as bases do perfil. |
| `POST /database-information/me` `{ content }` | Extrai nome/descrição, grava, dispara a indexação e responde **200** (com `indexStatus: PENDING`). |
| `PATCH /database-information/me/:id` `{ content }` | Extrai de novo, atualiza e reindexa. |
| `POST /database-information/me/:id/reindex` | Volta a base para `PENDING` com as tentativas zeradas e dispara a indexação (200). Usado pelo botão "Tentar indexar de novo" quando a base está `FAILED`. |
| `DELETE /database-information/me/:id` | Remove (204). Os trechos saem junto, pela cascata, na mesma transação. |

## Extração

- Create e update chamam `AiProvider.extract` com timeout de 15 s e no máximo
  2 tentativas (`DATABASE_INFORMATION_AI_*`), porque o usuário espera a resposta.
- Se a LLM falhar, a resposta é `502` e **nada é gravado**: no update, a base
  continua com o nome e o conteúdo anteriores.
- O update com conteúdo idêntico ao salvo não chama a LLM nem reindexa.
- O schema Zod da extração não usa palavras-chave de tamanho (o modo `strict` da
  OpenAI pode rejeitá-las). Os limites (`name` ≤ 80, `description` ≤ 300
  caracteres) ficam no prompt e são aplicados com `trim`/`slice` no service.
- Base de outro perfil responde `404`.

## Indexação (RAG)

- `KnowledgeIndexerService` divide o texto em trechos (`utils/knowledge-chunker.ts`:
  alvo de 1.000 e máximo de 1.200 caracteres, 150 de sobreposição, cada trecho
  começa com `Base: <nome>` e, quando há um rótulo de seção, `Seção: <rótulo>`), gera os embeddings pelo
  `EmbeddingProvider` do módulo `ai` (OpenAI `text-embedding-3-small`, 1536
  dimensões) e troca os trechos antigos pelos novos numa transação.
- Ciclo de vida em `indexStatus`: `PENDING → PROCESSING → READY | FAILED`.
  Create, update e reindex disparam a indexação em segundo plano logo após
  gravar (a resposta HTTP não espera).
- Rede de segurança: `schedules/knowledge-index.schedule.ts` roda a cada minuto
  e retoma bases `PENDING`, `FAILED` com menos de 3 tentativas
  (`KNOWLEDGE_INDEX_MAX_ATTEMPTS`) e `PROCESSING` abandonadas há mais de 5 min
  (reinício do servidor). Diferente dos eventos, aqui há retry, porque indexar
  é idempotente. Depois de 3 falhas a base fica `FAILED` até o usuário pedir o
  reindex. Para reconstruir tudo (banco novo, troca de modelo de embedding),
  basta voltar as bases para `PENDING`.
- A transação trava a linha da base e confere o `contentHash`: uma edição feita
  durante a indexação nunca é sobrescrita pelo texto antigo, e a busca nunca vê
  uma base pela metade. Base excluída no meio da indexação é ignorada.
- O front faz polling da lista a cada 3 s enquanto houver base `PENDING` ou
  `PROCESSING`.

## Busca

`KnowledgeSearchService.search` faz uma busca híbrida nos trechos das bases
`READY` do perfil (e só do `embeddingModel` atual):

- **Vetorial:** similaridade de cosseno com o embedding da query (timeout de
  10 s, 2 tentativas). Trecho que só aparece na busca vetorial precisa de
  similaridade mínima de 0,3 (`KNOWLEDGE_SEARCH_MIN_SIMILARITY`, valor inicial a
  calibrar com `knowledge_search_logs`).
- **Textual:** full-text do Postgres com o dicionário `portuguese` (acha nomes,
  números e códigos exatos).
- As duas listas (até 20 candidatos cada) são fundidas por *Reciprocal Rank
  Fusion* (k = 60). O resultado tem no máximo 5 trechos e 6.000 caracteres no
  total.
- Não há índice HNSW nem GIN, de propósito: toda busca é filtrada por perfil
  (no máximo algumas centenas de trechos), então a varredura exata pelo índice
  de `profileId` é rápida e tem recall perfeito.

## Consulta pelo assistente (n8n)

1. **Índice no contexto.** O contexto da run
   (`GET /assistant-m2m/runs/:runId/context`) traz
   `knowledge: [{ id, name, description }]` com **todas** as bases do perfil,
   indexadas ou não (ordenadas por criação). Vazio quando o plano do usuário não
   inclui a ferramenta. O nó *Build prompt* do `n8n.json` o renderiza no prompt
   do sistema como `<bases_de_conhecimento>` (JSON da lista) e, quando há
   bases, acrescenta o bloco "# Regra obrigatória das bases de conhecimento".
2. **Ferramenta `database_information`**, pela ferramenta genérica
   `executar_ferramenta` (`POST /assistant-m2m/runs/:runId/tools/execute`,
   `data` objeto ou JSON em texto). Duas operações, nesta ordem:
   - `search_knowledge` `{ query, databaseInformationId? }`: busca nas bases
     (todas, ou só a indicada). `query` tem até 500 caracteres. Retorna
     `{ query, found, results: [{ databaseInformationId, baseName, content }] }`.
     Cada busca é registrada em `knowledge_search_logs` com o `runId`.
   - `get_database_information` `{ databaseInformationId }`: leitura integral.
     Retorna `{ id, name, description, content }`. Não depende do índice, então
     funciona mesmo com a base `PENDING` ou `FAILED`.
3. **Regra do prompt** (em `assistant/config/guideline.config.ts`, na
   descrição da ferramenta e no *Build prompt* do `n8n.json`): sempre que algo
   das bases puder ser útil, buscar primeiro com `search_knowledge`; se a busca
   não trouxer o necessário e a descrição de alguma base indicar que ela ajuda,
   ler a base inteira com `get_database_information` (também para listar,
   contar ou resumir uma base). Mudou o texto do n8n: reimporte o `n8n.json`.
4. **Handler.** `services/database-information-tool.service.ts`
   (`@AssistantToolHandlerFor('database_information')`). O `profileId` vem da
   run, nunca do modelo; o `runId` chega pelo 4º parâmetro (`context`) de
   `AssistantToolHandler.execute`. Uma nova fonte de conhecimento entra como
   outra ferramenta no catálogo com o seu próprio handler; nada muda no n8n.
5. Protegido por `AssistantToolGuard` (`ASSISTANT_WORKFLOW_KEY`) e deve ser
   alcançado só pela rede `jarvis-internal`. Base de outro perfil ou id
   inexistente responde `not_found`; id ausente ou malformado, ou `query`
   vazia, `validation_error`.
