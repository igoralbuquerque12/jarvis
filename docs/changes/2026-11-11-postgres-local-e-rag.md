# Postgres local para o Jarvis e RAG nas bases de conhecimento

Data: 2026-11-11 | Versão: 1.0.0 → 1.1.0 | Plano: `docs/PLANO-RAG.md` (v2)

## Contexto

Esta mudança junta duas necessidades que o plano aprovado tratou em conjunto.

**Banco.** O banco do Jarvis vivia no Neon. O plano decidiu movê-lo para um Postgres rodando no `compose.yml` da raiz, com a extensão pgvector, e começar esse banco do zero (sem migrar dados do Neon). O plano não registra um motivo além da decisão. O que ele registra são as consequências aceitas pelo dono:

- todos os usuários precisam se cadastrar e parear o WhatsApp de novo, porque perfis, tokens e sessões somem;
- o número do Jarvis precisa ler o QR de novo, porque `whatsapp_auth` também zera;
- a API key que o CI usa para notificar o deploy (`JARVIS_API_KEY`) deixa de valer e precisa ser recriada.

Com o banco local, o Neon deixa de fazer backup por nós, então o backup passou a ser parte da mudança.

**Bases de conhecimento.** Até aqui o assistente só conseguia ler uma base de conhecimento inteira (`get_database_information`), escolhida pela descrição que a IA gerou ao salvar. Perguntas pontuais sobre um detalhe que a descrição não cita dependiam de o modelo adivinhar a base certa e carregar o texto todo. A mudança adiciona uma busca por trechos (RAG híbrido) que o modelo chama sob demanda, e mantém a leitura integral para pedidos como "me manda a lista toda" ou "quantos itens tem".

Ajuste importante em relação ao plano v2: **o Securo não foi alterado**. Ele continua com o próprio `securo-db` e o volume `securo-pgdata`. Só o Jarvis saiu do Neon. Onde o plano fala em database `securo` dentro do Postgres novo, roles separados ou script de inicialização, vale este ajuste.

Fora do escopo desta mudança: o corte em produção (parar serviços, subir o Postgres, rodar migrations e seed, ler o QR, recriar conta e API key) é um procedimento manual descrito no plano, e a atualização das docs gerais (`CLAUDE.md`, `docs/DEPLOYMENT.md` etc.) é trabalho à parte.

## O que foi feito

O compose da raiz ganhou um serviço `postgres` (pgvector), e o `server` e o `migrate` passaram a apontar para ele. Em paralelo, a configuração de IA foi dividida em duas variáveis (extração e embeddings). No schema, as bases de conhecimento ganharam estado de indexação e uma tabela de trechos com vetor (`KnowledgeChunk`). Um indexador quebra o texto em trechos, gera os embeddings e os grava; um serviço de busca combina similaridade vetorial e busca textual em português; e a ferramenta `database_information` do assistente ganhou a operação `search_knowledge`. O prompt (backend e `n8n.json`) manda o modelo buscar sempre que uma base puder ajudar. A tela Conhecimento da web mostra o status da indexação.

## Explicação por partes

### 1. Infra: Postgres local e backup

**Necessidade.** O Jarvis precisava de um banco próprio dentro da stack, com pgvector disponível e com backup, já que ninguém mais cuida disso depois que o Neon sai.

**Como resolve.**

- `compose.yml` ganhou o serviço `postgres` (imagem `pgvector/pgvector:pg16`, container `jarvis-postgres`, database e usuário `jarvis`, dados no volume `postgres-data`). A porta é publicada apenas em `127.0.0.1` (padrão 5432, configurável por `JARVIS_DB_HOST_PORT`), para dev local e túnel SSH. O healthcheck usa `pg_isready`.
- A senha vem de `JARVIS_DB_PASSWORD`, lida do `.env` da raiz com a sintaxe que falha se a variável não existir, para ninguém subir com senha vazia.
- A `DATABASE_URL` de `server` e `migrate` agora é montada pelo próprio compose a partir de uma âncora YAML (`x-jarvis-database-url`) e **sobrescreve** a do `server/.env`. É por isso que o `server/.env` só precisa apontar para `localhost` no dev local. `migrate` e `server` passaram a depender de `postgres` saudável.

O Securo não foi tocado: `securo-db`, `securo-pgdata` e as variáveis `x-securo-env` continuam como estavam.

### 2. Variáveis e provedores de IA

**Necessidade.** `AI_PROVIDER` era ambígua: com embeddings entrando, existem duas finalidades de IA com fornecedores diferentes (a Groq, por exemplo, não tem API de embeddings).

**Como resolve.** Cada finalidade ganhou sua variável: `AI_EXTRACTION_PROVIDER` (`openai` ou `groq`, gera nome e descrição das bases) e `AI_EMBEDDING_PROVIDER` (só `openai`). Em `server/src/ai/`:

- `constants/ai.constant.ts` concentra os nomes das variáveis, os valores aceitos, a dimensão dos vetores (1536) e o tamanho do lote de embeddings (96).
- `utils/resolve-provider-name.ts` lê e valida a variável de cada finalidade (`resolveProviderName`) e faz o boot falhar se só a variável antiga existir (`assertNoLegacyProviderEnv`), com uma mensagem que diz o nome novo. Assim ninguém sobe em produção achando que `AI_PROVIDER` ainda vale.
- `contracts/embedding-provider.contract.ts` define o contrato `EmbeddingProvider`, separado de `AiProvider`. Cada vetor é gravado com o nome do modelo que o gerou, porque vetores de modelos diferentes não são comparáveis.
- `services/embedding.service.ts` é um decorador sobre o adaptador: divide o texto em lotes de 96 e repete lotes que falham por erro temporário. Do outro lado, `openai/openai-embedding.provider.ts` é o adaptador da OpenAI (modelo `text-embedding-3-small`, definido em `openai/openai.constant.ts`), apoiado em `utils/embeddings.util.ts`, que chama o endpoint `/embeddings` e rejeita respostas com vetores faltando ou do tamanho errado.
- `ai.module.ts` monta as duas cadeias (extração e embeddings) e exporta `AiProvider` e `EmbeddingProvider` para quem importar o `AiModule`.

Para não duplicar código, a lógica de retry de `AiService` virou `utils/with-retry.util.ts` (`withAiRetry`) e o POST HTTP com tradução de erros que estava em `chat-completions.util.ts` virou `utils/provider-http.util.ts` (`postToProvider`). Extração e embeddings agora usam os mesmos dois utilitários, sem mudança de comportamento na extração. A `OPENAI_API_KEY` passa a ser sempre obrigatória no boot (os embeddings só existem na OpenAI); a `GROQ_API_KEY` continua exigida apenas quando a extração é `groq`.

### 3. Schema e migration

**Necessidade.** Guardar o estado da indexação de cada base e os trechos pesquisáveis, com integridade referencial.

**Como resolve.** `server/prisma/schema.prisma` e a migration `20261111151719_add_knowledge_rag`:

- `DatabaseInformation` ganhou `contentHash` (SHA-256 do texto, que identifica a versão indexada), `indexStatus` (enum `KnowledgeIndexStatus`: `PENDING`, `PROCESSING`, `READY`, `FAILED`), `indexError`, `indexAttempts`, `indexStartedAt`, `indexedAt` e `chunkCount`.
- `KnowledgeChunk` (`knowledge_chunks`) guarda cada trecho com `position`, `content`, `embedding` (tipo `vector(1536)`, declarado no Prisma como `Unsupported`, então lido e escrito por SQL cru) e `embeddingModel`. Tem chave estrangeira para a base e para o perfil, ambas com `ON DELETE CASCADE`.
- `KnowledgeSearchLog` (`knowledge_search_logs`) registra cada busca (perfil, `runId`, consulta e resultados) para calibrar o limiar de similaridade depois.
- A migration começa habilitando a extensão `vector`, porque o Prisma não gerencia extensões. Isso funciona sem script de inicialização porque o usuário `jarvis` é o usuário de bootstrap da imagem e, portanto, superusuário do próprio database.

Não há índice HNSW nem GIN, de propósito (veja *Decisões importantes*).

### 4. Indexação das bases

**Necessidade.** Transformar o texto de uma base em trechos com embedding, sem travar o salvamento na web, sem deixar a busca ver uma base pela metade e sem sobrescrever uma edição mais nova com um texto antigo.

**Como resolve.** Em `server/src/database-information/`:

- `utils/knowledge-chunker.ts` quebra o texto primeiro pela estrutura e depois pelo tamanho. Parágrafos são a unidade; títulos markdown e linhas curtas do tipo "Rótulo:" abrem uma seção nova. Parágrafos grandes são cortados por linhas, depois frases, depois palavras. O alvo é 1000 caracteres, o máximo 1200, com 150 de sobreposição entre trechos da mesma seção. Todo trecho começa com um cabeçalho "Base: ... / Seção: ...", porque uma linha curta como "senha: 1234" sozinha quase não tem significado para o embedding. As constantes ficam em `constants/database-information.constant.ts`.
- `utils/knowledge-text.ts` tem o hash do conteúdo, a conversão do vetor para o literal do pgvector e a montagem da consulta textual (palavras ligadas por OR).
- `services/knowledge-indexer.service.ts` é o indexador. Ele "reivindica" a base com um `updateMany` condicional (vira `PROCESSING` e conta a tentativa), quebra o texto e gera os embeddings **fora** de transação (a chamada à OpenAI pode demorar). Só então abre uma transação que trava a linha da base (`SELECT ... FOR UPDATE`), confere se o `contentHash` ainda é o mesmo, apaga os trechos antigos, insere os novos e marca `READY`. Os desfechos são `indexed`, `skipped`, `stale` (o texto mudou no meio; a indexação mais nova vence), `deleted` (a base foi excluída no meio; uma violação de chave estrangeira no insert é tratada como isso) e `failed`. A marcação `FAILED` vale só para a versão do texto que estava sendo indexada.
- `schedules/knowledge-index.schedule.ts` roda a cada minuto como rede de segurança: pega bases `PENDING`, `FAILED` com menos de 3 tentativas e `PROCESSING` abandonadas há mais de 5 minutos (reinício do servidor), até 20 por rodada, uma de cada vez e sem sobrepor rodadas lentas.
- `services/database-information.service.ts` (o CRUD) agora grava o `contentHash`, volta a base para `PENDING` com tentativas zeradas ao editar e dispara a indexação em segundo plano sem segurar a resposta. Ganhou o método `reindex`, exposto em `controllers/database-information.controller.ts` como `POST /database-information/me/:id/reindex`. `database-information.module.ts` registra os novos providers e `entities/database-information.view.ts` passa a devolver `indexStatus`, `indexedAt` e `chunkCount` (o erro bruto da indexação não vai para o cliente).

A exclusão não ganhou código: ao apagar a base (ou a conta), o Postgres apaga todos os trechos na mesma transação pelo `ON DELETE CASCADE`. Isso foi pedido explicitamente pelo dono.

### 5. Busca e ferramenta do assistente

**Necessidade.** Dar ao modelo uma forma de achar o trecho certo em todas as bases do usuário de uma vez, incluindo detalhes que a descrição da base não menciona.

**Como resolve.**

- `services/knowledge-search.service.ts` gera o embedding da consulta (timeout de 10 s, 2 tentativas, porque a busca acontece enquanto o modelo espera) e roda uma única consulta SQL sobre os trechos do perfil, restrita a bases `READY` e ao mesmo `embeddingModel` do modelo atual. Em memória, ele monta dois rankings (por similaridade de cosseno, com mínimo de 0,3, e por busca textual em `portuguese`, onde qualquer acerto qualifica), pega até 20 candidatos de cada e os funde por *Reciprocal Rank Fusion* (`utils/rank-fusion.ts`, constante k = 60). Saem até 5 trechos, limitados a 6000 caracteres no total. A busca textual cobre nomes, números e códigos exatos; a vetorial cobre o significado. Cada busca é registrada em `knowledge_search_logs` sem bloquear a resposta; se o log falhar, a busca não falha.
- `dto/search-knowledge.dto.ts` valida os dados da operação (`query` de até 500 caracteres e `databaseInformationId` opcional para restringir a uma base). `entities/knowledge-search.view.ts` define o que o modelo recebe: `query`, `found` e, por resultado, `databaseInformationId`, `baseName` e `content`. Scores e similaridade ficam só no log.
- `services/database-information-tool.service.ts` (o handler da ferramenta) ganhou a operação `search_knowledge`; `get_database_information` foi mantida. Nada muda na forma como o n8n chama as ferramentas (continua sendo `executar_ferramenta`).
- Para o log saber de qual run veio a busca, `AssistantToolHandler.execute` (em `assistant/tools/tool-handler.ts`) ganhou um quarto parâmetro opcional `context` com o `runId`, e `AssistantToolDispatcherService` passa esse valor. O `runId` vem da run, nunca do modelo, como o resto da identidade da chamada.

### 6. Prompt: como o modelo é instruído a buscar

**Necessidade.** Ter a ferramenta não basta: o objetivo é que o modelo busque no RAG **sempre** que uma base puder ajudar, e só leia a base inteira quando a busca não resolver.

**Como resolve.** A regra tem três passos e aparece em três lugares coerentes entre si:

1. buscar com `search_knowledge` antes de responder, perguntar ao usuário ou dizer que não sabe, escrevendo a consulta com palavras-chave e sem pronomes;
2. se a busca não trouxer o necessário e a descrição de alguma base indicar que ela pode ajudar, ler a base inteira com `get_database_information` (também usada quando o pedido exige a base completa: listar tudo, contar, resumir);
3. responder só com o que foi retornado e dizer "não encontrei nas bases" apenas depois dos passos 1 e 2.

Os arquivos:

- `assistant/tools/database-information.tools.ts`: o descritor da ferramenta lista `search_knowledge` primeiro e `get_database_information` segundo, com `whenToUse`, campos, exemplo e notas de cada uma. Esse texto é o que o endpoint de ferramentas renderiza para o n8n. `assistant/tests/main.tools.spec.ts` foi atualizado para travar essa ordem.
- `assistant/config/guideline.config.ts`: a diretiva padrão ganhou a regra em três passos na seção "Fontes de verdade" e dois exemplos (uma busca que responde direto; uma busca parcial seguida da leitura integral).
- `n8n.json`, nó "Build prompt": passou a montar o bloco "Regra obrigatória das bases de conhecimento", renderizado **somente quando o usuário tem bases**. **O `n8n.json` precisa ser reimportado no n8n** para essa parte valer; a diretiva do backend chega ao n8n sozinha pelo endpoint de contexto.

### 7. Web: status da indexação

**Necessidade.** A indexação é assíncrona; o usuário precisa saber se a base já pode ser encontrada pelo assistente e ter como reagir a uma falha.

**Como resolve.** Na tela Configurações → Conhecimento:

- `features/settings/components/database-information-row.tsx` mostra um selo por base: "Indexando…" (`PENDING` e `PROCESSING`), "Pronta para busca" (`READY`) ou "Falha na indexação" (`FAILED`). Quando está `FAILED`, aparece um botão "Tentar indexar de novo".
- `features/settings/pages/knowledge-page.tsx` liga esse botão à nova função de serviço e atualiza os textos da página, que agora explicam que salvar indexa o conteúdo e que excluir apaga também o que foi indexado.
- `hooks/use-my-database-information.ts` consulta a lista de novo a cada 3 segundos enquanto alguma base está sendo indexada e para sozinho quando todas se resolvem.
- `services/database-information.service.ts` ganhou `reindexMyDatabaseInformation` (chama a rota de reindexação) e `types/api.ts` ganhou o tipo `KnowledgeIndexStatus` e os campos novos de `DatabaseInformation`.

### 8. Versão e variáveis de exemplo

`VERSION` foi de 1.0.0 para 1.1.0 (mudança visível ao usuário, conforme a regra do repositório). `server/.env.example` passou a documentar a nova `DATABASE_URL` local, `AI_EXTRACTION_PROVIDER` e `AI_EMBEDDING_PROVIDER`, e a obrigatoriedade de `OPENAI_API_KEY`.

## Decisões importantes

- **O Securo manteve o próprio banco (decisão do dono).** Por isso não existe database `securo` no Postgres novo, nem roles separados, nem script de inicialização. É um desvio do plano v2. Consequência: o `postgres-backup` cobre apenas o database do Jarvis; o `securo-db` não é coberto por ele.
- **Busca como ferramenta sob demanda, não triagem automática em toda mensagem.** O Jarvis é um assistente de ações ("me lembra...", "gastei..."); buscar em toda mensagem poluiria o contexto no caso mais comum, e a mensagem crua é uma consulta ruim em continuações ("e o segundo?"). O modelo escreve a própria consulta. A triagem automática só seria considerada se os logs de busca mostrassem que o modelo deixa de buscar quando devia.
- **RAG híbrido, sem GraphRAG.** O volume por usuário é pequeno (até 10 bases de 20 mil caracteres), então a base inteira cabe no contexto e o GraphRAG multiplicaria o custo de indexação sem ganho. Vetores cobrem significado e a busca textual cobre termos exatos; o RRF funde os dois rankings sem pesos para calibrar.
- **Sem índice HNSW nem GIN.** Toda busca filtra por `profileId` (poucas centenas de trechos), então a varredura exata é sub-milissegundo e tem recall perfeito. O HNSW com filtro ainda poderia devolver menos linhas do que o pedido. Pelo mesmo motivo a busca textual calcula o `to_tsvector` na hora, em vez de manter uma coluna de busca textual (que o plano v2 previa).
- **O índice `knowledge` do contexto continua listando todas as bases, não só as `READY`.** Ler a base inteira não depende do RAG, e o passo 2 da regra usa as descrições; só a busca se limita a `READY`. É um desvio do plano v2. Efeito colateral aceito: uma base recém-salva ou em reindexação não aparece na busca até ficar `READY` (o texto da ferramenta avisa que pode levar alguns segundos).
- **Sem junção de trechos vizinhos nos resultados.** O plano previa unir vizinhos, mas com a sobreposição de 150 caracteres isso duplicaria texto.
- **Indexar tem retry; eventos e runs do assistente não.** Indexar é idempotente (os trechos são substituídos inteiros), então repetir é seguro. Já uma run presa em `PROCESSING` nunca é reprocessada para não executar uma ação duas vezes.
- **Os trechos são reconstruíveis.** O texto original está em `database_informations`; se o banco vier vazio ou o modelo de embedding mudar, basta voltar as bases para `PENDING` e a varredura reindexa. Por isso cada trecho guarda o `embeddingModel` e a busca ignora trechos de outro modelo.
- **Exclusão por cascade.** Apagar a base apaga seus trechos na mesma transação, sem código extra e sem chance de sobrar órfão; apagar a conta desce em cascata (perfil, bases, trechos). Se uma indexação estiver rodando na hora, o insert dela falha por chave estrangeira e o indexador encerra em silêncio.
- **Sem backup automático.** O serviço `postgres-backup` chegou a ser implementado, mas foi removido a pedido do dono do projeto. Dump e restauração ficam manuais (`docs/DEPLOYMENT.md`, seção 4).
- **`JARVIS_DB_PASSWORD` é obrigatória e precisa ser segura para URL.** O compose falha ao ler o arquivo se a variável não existir, então qualquer comando `docker compose` (inclusive os do deploy na VPS) exige que ela esteja no `.env` da raiz. Como a senha entra numa URL de conexão, deve evitar caracteres especiais (o comentário no compose sugere gerar com `openssl rand -hex 24`).
- **`OPENAI_API_KEY` sempre obrigatória**, mesmo com `AI_EXTRACTION_PROVIDER=groq`, porque os embeddings só existem na OpenAI.
- **Privacidade.** O conteúdo das bases agora também vai para a API de embeddings da OpenAI. Ele já ia para o LLM de extração, então o risco não é novo.

## Mudanças não previstas

Pequenas e incidentais, sem impacto de comportamento:

- `server/.env.example`: foi removida uma linha duplicada de `DATABASE_URL` (o arquivo tinha a variável duas vezes).
- `server/prisma/schema.prisma`: as colunas do model `Profile` foram realinhadas (formatação), além das duas relações novas (`knowledgeChunks` e `knowledgeSearchLogs`).

## Como verificar

Pré-requisito: `JARVIS_DB_PASSWORD` no `.env` da raiz e a mesma senha na `DATABASE_URL` do `server/.env` (apontando para `localhost:5432`), mais `OPENAI_API_KEY` válida para a indexação e a busca de verdade.

1. **Banco.** Na raiz, `docker compose up -d postgres`. Confira com `docker compose ps` que `jarvis-postgres` está saudável.
2. **Migration.** Em `server/`, `npx prisma migrate deploy` (e `npx prisma generate`, porque o schema mudou). Depois `npm run db:seed` se o banco estiver vazio. Confira no banco que existem as tabelas `knowledge_chunks` e `knowledge_search_logs` e a extensão `vector`.
3. **Testes e build.** Em `server/`, `npm test` (262 testes na entrega), `npm run build` e `npm run lint`. Em `web/`, `npm run build` e `npm run lint`.
4. **Variável antiga.** Subir o servidor com `AI_PROVIDER` definida e sem `AI_EXTRACTION_PROVIDER` deve derrubar o boot com a mensagem que cita o nome novo.
5. **Tela Configurações → Conhecimento.** Crie uma base: o selo aparece como "Indexando…" e passa para "Pronta para busca" em alguns segundos, sem recarregar a página. Edite o conteúdo e veja o ciclo se repetir. Para ver a falha, use uma `OPENAI_API_KEY` inválida: o selo vira "Falha na indexação" e o botão "Tentar indexar de novo" reenfileira a base. Ao excluir a base, `SELECT count(*) FROM knowledge_chunks WHERE "databaseInformationId" = '<id>'` deve dar 0 logo em seguida.
6. **Chamada M2M `search_knowledge`.** Com uma run em `PROCESSING` (uma mensagem real em andamento, ou uma linha criada à mão em `assistant_runs` no banco de dev), chame `POST /assistant-m2m/runs/:runId/tools/execute` com a chave do workflow no cabeçalho `x-api-key` e o corpo `{ "tool": "database_information", "operation": "search_knowledge", "data": { "query": "..." } }`. Com uma base `READY`, a resposta traz `found: true` e trechos começando com "Base:" e "Seção:"; também deve nascer uma linha em `knowledge_search_logs` com o `runId`. Com uma run de outro perfil, os trechos do primeiro não devem aparecer. Uma `query` vazia ou campos desconhecidos voltam como `validation_error`.
8. **n8n.** Reimporte o `n8n.json` e confira que o prompt montado pelo nó "Build prompt" contém o bloco "Regra obrigatória das bases de conhecimento" para um usuário com bases e não o contém para um usuário sem bases.

Durante a implementação, além dos testes unitários, um script de integração descartável contra o Postgres local (com um embedder falso) passou em 14 checagens: indexa, a busca acha o trecho certo, há isolamento por perfil, um termo exato é achado pela busca textual, o caso `stale` é respeitado e o cascade funciona ao excluir base e perfil. Esse script não faz parte do diff.
