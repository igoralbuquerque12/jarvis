# Assistente (n8n + prompt): diagnóstico e correção

Este documento explica por que o Jarvis respondia "significado de bom dia: ..." a um simples "bom dia", por que ele nunca usava as ferramentas, o que foi corrigido e quais técnicas de engenharia de prompt e de design de agentes foram aplicadas. As fontes de referência foram o [GPT-4.1 Prompting Guide](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide) da OpenAI e o [guia de prompting para GPT-5.6](https://codexis.ai/en/guide/prompting-guide/gpt-5-6/) da Codexis, além do código-fonte do n8n para confirmar o comportamento dos nós.

Resumo em uma frase: o modelo não era "burro"; ele estava recebendo um JSON de configuração como se fosse a fala do usuário, sem system prompt, com ferramentas sem descrição que o n8n nem sabia montar, e com um histórico cheio das próprias respostas erradas.

## 1. Como o fluxo funciona (para situar)

```
WhatsApp → Baileys → AssistantMainService → POST webhook n8n
                                             │
                          Validate input → Build prompt → AI Agent (Groq gpt-oss-120b)
                                                              ├─ tool create_event ─┐
                                                              ├─ tool find_active_events ├─► Jarvis /events-m2m
                                                              ├─ tool delete_event ──┘
                                                              └─ tool finance ─────────► Jarvis /finance-m2m
                                             ◄── { response } ◄── Format response
WhatsApp ◄── resposta
```

O backend NestJS não roda nenhum modelo. Ele monta o payload (instruções, contexto do perfil, histórico, mensagem atual, data/hora) e o n8n executa o agente. As ferramentas são chamadas de volta nos endpoints M2M do próprio backend.

## 2. Diagnóstico: a cadeia de falhas

Nenhuma dessas falhas sozinha explicaria tudo. Juntas, elas produziam exatamente o comportamento observado.

### F1. A mensagem do usuário era um JSON de configuração (causa do "significado de bom dia")

No nó **AI Agent**, o campo `text` (o que o modelo recebe como fala do usuário) continha isto:

```
={
  "promptType": "define",
  "text": "={{ $json.currentMessage }}",
  "options": { "systemMessage": "={{ $json.systemPrompt }}" }
}
```

Alguém colou a configuração do nó dentro do campo de texto. O n8n avaliava as expressões `{{ }}` e o modelo recebia, como mensagem do usuário, um blob JSON com `"text": "=bom dia"` e o prompt inteiro embutido dentro de uma chave `systemMessage`. E o campo `options.systemMessage` de verdade estava vazio, então o agente rodava com o system prompt padrão do n8n ("You are a helpful assistant").

Para um modelo, um JSON com um campo `text: "=bom dia"` e nenhuma instrução parece um pedido de processamento de texto. A interpretação mais provável é "analise/defina esta string". Daí "significado de bom dia: ...". O modelo estava, na verdade, obedecendo o que via.

### F2. As ferramentas não existiam do ponto de vista do modelo

Os nós `Events Tool1` e `Finance Tool1` eram do tipo `@n8n/n8n-nodes-langchain.toolHttpRequest` v1.1. Verificando o código-fonte do n8n:

- Esse nó está marcado como `hidden: true` e foi substituído pelo nó **HTTP Request** comum usado como tool (`n8n-nodes-base.httpRequestTool`).
- Ele **não entende `$fromAI()`**. Seu mecanismo é `{placeholder}` com uma seção "Placeholder Definitions". Como não havia placeholders, a tool era registrada **sem nenhum parâmetro**.
- O campo `toolDescription` (obrigatório) estava vazio. O modelo recebia uma função chamada `Events_Tool1`, sem descrição, sem argumentos.
- Mesmo em um nó que entende `$fromAI`, o tipo `'object'` usado em `$fromAI('data', ..., 'object')` é inválido. O parser aceita apenas `string`, `number`, `boolean` e `json` e lança `Invalid type: object`.

Resultado: o modelo via duas funções anônimas e inúteis. Não chamar nenhuma era a decisão correta.

### F3. O prompt mandava usar ferramentas que não existiam e ignorava o catálogo

O backend envia em toda mensagem um catálogo `tools` (`ASSISTANT_TOOLS`) com as operações e seus campos. O nó de montagem do prompt no n8n **nunca lia** esse campo. Em vez disso, tinha regras fixas que citavam `create_unique_event` e `create_recurring_event`, operações que não existem. A operação real é `create_event` com `type: UNIQUE | RECURRENCE`.

O `DEFAULT_DIRECTIVE` do backend também tinha instruções conflitantes, algo que o guia da OpenAI destaca como causa clássica de comportamento errático:

- "Antes de responder, utilize ferramentas quando elas puderem fornecer uma resposta mais precisa" (empurra para chamar ferramenta em tudo, inclusive em "bom dia").
- "Nunca execute ações sem autorização explícita do usuário" (impede de criar um lembrete quando o usuário pede um lembrete).
- "Lembre das memórias fornecidas" (não existe nenhuma memória no sistema).

### F4. O histórico reforçava o erro

O backend carrega as últimas mensagens e o n8n as coloca no prompt. Depois da primeira resposta "significado de bom dia", cada mensagem seguinte chegava com esse exemplo de comportamento no contexto. Modelos tratam o histórico como demonstração implícita (few-shot) do que é esperado. É o efeito de ancoragem: a conversa passada vira o padrão do futuro.

### F5. Problemas secundários

- **Autenticação das tools**: os endpoints M2M estão protegidos pelo `WhatsappAdminGuard`, que só aceitava `x-admin-key` ou `Authorization`. A credencial "Header Auth account" do n8n é a mesma do webhook, que usa `x-api-key`. A própria mensagem de erro do guard prometia aceitar `x-api-key`, mas o código não aceitava.
- **Catálogo desatualizado**: `main.tools.spec.ts` descrevia sete tools de finanças que não existiam mais; o teste estava quebrado, e o `nest build` falhava em um `data` possivelmente indefinido no controller de eventos.
- **Payload gordo**: as mensagens do histórico iam com `id`, `userId`, `updatedAt`, e o input inteiro (prompt incluso) era impresso com `console.log` a cada mensagem.

## 3. O que foi corrigido

### 3.1 Workflow do n8n ([n8n.json](n8n.json))

O arquivo foi regenerado por script para evitar erros de escape. Importe-o por cima do workflow atual.

| Nó | Antes | Depois |
|---|---|---|
| AI Agent | `text` com JSON literal, sem `systemMessage` | `text = {{ $json.currentMessage }}`, `options.systemMessage = {{ $json.systemPrompt }}`, `maxIterations` 8 |
| Tools | 2 nós legados ocultos, sem descrição, `$fromAI` ignorado | 4 nós `httpRequestTool` v4.2 com descrição manual: `create_event`, `find_active_events`, `delete_event` (parâmetros tipados) e `finance` (RPC `operation` + `data`) |
| Build prompt | Regras fixas com nomes de tool errados; histórico em texto solto | Recebe as instruções prontas do backend; adiciona contexto em blocos XML (`<data_e_hora_atual>`, `<perfil_do_usuario>`, `<historico_recente>`) e um lembrete final |
| Groq Chat Model | temperatura padrão 0.7 | 0.2 (mais determinístico para tool calling) |
| URL das tools | domínio público | `http://server:3000` (rede interna, conforme DEPLOYMENT.md) |
| Opções HTTP | erro 4xx derrubava a tool | `neverError: true`: o corpo do erro de validação volta para o modelo, que corrige os argumentos |

Detalhes que merecem atenção:

- **Parâmetros opcionais em `create_event`**: `recurrenceInterval` e `recurrenceMode` têm default (`0` e `""`), e a expressão faz `|| undefined`. `JSON.stringify` descarta chaves `undefined`, então um evento `UNIQUE` sai sem esses campos, exatamente como o backend exige.
- **`data` da tool `finance` é uma string JSON**, não um objeto. Motivo: o tipo `json` do `$fromAI` rejeita objetos vazios (`minProperties: 1`), e operações como `list_accounts` não têm parâmetros. O DTO do backend passou a aceitar `data` como objeto ou como string JSON.
- Todas as expressões `$fromAI` foram validadas com o parser real do pacote `n8n-workflow` (`extractFromAICalls` + `generateZodSchema`).

### 3.2 Backend

- [guideline.config.ts](server/src/assistant/config/guideline.config.ts): prompt reescrito com a estrutura do guia GPT-4.1 (ver seção 4).
- [build-system-prompt.ts](server/src/assistant/utils/build-system-prompt.ts): novo. Renderiza o catálogo de tools em Markdown (`# Ferramentas disponíveis`) e o anexa ao prompt; calcula a data/hora no fuso do perfil com Luxon (`now` em ISO com offset e `nowHuman` em pt-BR). Tem spec própria.
- [events.tools.ts](server/src/assistant/tools/events.tools.ts) e [finance.tools.ts](server/src/assistant/tools/finance.tools.ts): o catálogo ganhou `operations[]` estruturadas (nome, quando usar, campos com tipo e obrigatoriedade, exemplo, observações) e o campo `rpcToolName` que indica se o módulo é exposto como uma tool única ou uma por operação. Os enums vêm do que os DTOs realmente aceitam.
- [assistant-main.service.ts](server/src/assistant/services/assistant-main.service.ts): envia `directive` já com o catálogo renderizado, `now`/`nowHuman`/`timezone`, e um histórico enxuto (`type`, `content`, `createdAt`). Logs passaram para `logger.debug` sem despejar o prompt inteiro.
- [execute-operation.dto.ts](server/src/core/dto/execute-operation.dto.ts): `data` aceita string JSON (parse via `@Transform`); string inválida gera erro 400 legível pelo modelo.
- [whatsapp-admin.guard.ts](server/src/whatsapp/guards/whatsapp-admin.guard.ts): aceita `x-api-key` e `x-whatsapp-admin-key` além de `x-admin-key` e `Authorization`.
- [main.tools.spec.ts](server/src/assistant/tests/main.tools.spec.ts): reescrito para a forma atual do catálogo.

## 4. Técnicas aplicadas e de onde vieram

### 4.1 Estrutura do system prompt (GPT-4.1 guide, "Prompt Organization")

O guia recomenda um esqueleto fixo. O novo prompt segue exatamente essa ordem, em pt-BR:

```
# Papel e objetivo
# Instruções
  ## Conversa
  ## Quando usar ferramentas
  ## Dados obrigatórios e perguntas
  ## Depois da ferramenta
  ## Datas, horários e valores
# Como raciocinar antes de responder      (Reasoning Steps)
# Formato da resposta                     (Output Format)
# Exemplos                                (Examples)
# Ferramentas disponíveis                 (renderizado do catálogo)
# Contexto desta conversa                 (adicionado pelo n8n: data, perfil, histórico)
# Lembrete final                          (Final instructions)
```

Por que funciona: modelos seguem melhor instruções quando cada tipo de informação tem um lugar previsível. Misturar regra, contexto e exemplo em um parágrafo só, como no prompt antigo, dilui o peso de cada instrução.

### 4.2 Os três "lembretes agênticos" (GPT-4.1 guide, "Agentic Workflows")

O guia mede um ganho de cerca de 20% em tarefas agênticas ao incluir três lembretes. Eles foram adaptados ao contexto conversacional:

| Lembrete | Texto original (resumo) | Versão no Jarvis |
|---|---|---|
| Persistência | "keep going until the user's query is completely resolved" | "Conclua o pedido dentro da mesma resposta. Se uma ação depende de uma consulta, faça a consulta e depois a ação, sem devolver o problema ao usuário." |
| Uso de ferramentas | "do NOT guess or make up an answer" | "Se a resposta depende de dados do usuário que estão no sistema, consulte a ferramenta. Nunca invente nem estime esses dados." |
| Planejamento | "plan extensively before each function call" | Seção "Como raciocinar antes de responder" com 4 passos: classificar, decidir ferramenta, checar campos obrigatórios, executar e avaliar. |

### 4.3 Ferramentas pela API, descrições no schema, exemplos no prompt

O guia é explícito: passe ferramentas pelo campo `tools` da API (no n8n, os nós de tool) em vez de descrevê-las só no prompt, e ponha os exemplos de uso em uma seção `# Examples` do prompt em vez de inflar a descrição da função. Foi o que se fez:

- Cada nó de tool tem uma `toolDescription` curta dizendo o que faz e quando usar.
- Cada parâmetro `$fromAI` tem uma descrição própria com formato e exemplo.
- O detalhamento (enums, obrigatoriedade, exemplos de payload) fica no prompt, na seção de ferramentas gerada a partir do catálogo, e os exemplos de conversa mostram a chamada correta em contexto.

Sobre o desenho das tools: para eventos, uma tool por operação com campos tipados (`type`, `startAt`, `content`...). O modelo enxerga um schema JSON real e erra muito menos do que quando precisa montar um objeto livre. Para finanças, com quase trinta operações, uma tool única `finance` com `operation` + `data` evita trinta nós no n8n; a precisão vem da referência de operações no prompt e do feedback de erro do backend.

### 4.4 Literalidade e modos de falha (GPT-4.1 guide, "Instruction Following")

O guia lista falhas típicas e as correções foram aplicadas uma a uma:

- **Alucinação de argumentos** quando o prompt manda "sempre usar ferramenta": corrigido com "se faltar algo ou houver ambiguidade real, não chame a ferramenta: faça uma única pergunta objetiva pedindo apenas o que falta".
- **Instruções conflitantes** (o guia observa que a última tende a vencer, gerando comportamento instável): removidos "use ferramentas antes de responder" e "nunca execute sem autorização". Substituídos por uma regra de autoridade clara.
- **Frases repetitivas**: "Varie as formulações; não repita sempre a mesma frase de confirmação."
- **Prosa excessiva**: seção de formato define 1 a 4 linhas, sem títulos, tabelas ou código, adequado ao WhatsApp.

### 4.5 Autoridade e limites (guia GPT-5.6, "Agentic behavior")

O guia da Codexis insiste em definir "o que o modelo pode fazer sozinho e o que exige confirmação". No Jarvis:

- Pedido claro de ação é autorização suficiente (criar lembrete, registrar gasto).
- Confirmação só antes de excluir ou quando há mais de uma interpretação com efeitos diferentes.
- Fora de escopo: nunca revelar `profileId`, nomes de tools, JSON ou erros técnicos.

Também seguindo esse guia: descrever o resultado esperado em vez de roteirizar cada passo ("descreva o que você quer alcançar"), e um protocolo de esclarecimento explícito (uma pergunta, só o que falta).

### 4.6 Delimitadores: Markdown para instruções, XML para contexto, nada de JSON

O guia GPT-4.1 recomenda Markdown como ponto de partida, XML para envolver seções e documentos, e desaconselha JSON para conteúdo, principalmente em contexto longo. Ironicamente, o bug F1 era literalmente JSON como conteúdo.

Agora o histórico chega assim:

```xml
<historico_recente>
<mensagem autor="usuario">bom dia</mensagem>
<mensagem autor="jarvis">Bom dia! Tudo certo por aí?</mensagem>
</historico_recente>
```

Sinais `<` e `>` dentro das mensagens do usuário são trocados por caracteres parecidos, para que uma mensagem nunca consiga fechar ou abrir uma tag do contexto (defesa simples contra prompt injection).

### 4.7 Instruções no início e no fim (GPT-4.1 guide, "Long Context")

Em prompts longos, colocar as instruções essenciais tanto antes quanto depois do contexto supera colocá-las só em um lugar. O bloco "# Lembrete final" repete o essencial depois do histórico: responda à fala atual, em pt-BR, use ferramentas quando a tarefa exigir, conclua o pedido, sem detalhes técnicos.

### 4.8 Enquadramento conversacional

Um ponto específico de IA conversacional: o modelo precisa saber que a entrada é uma **fala dirigida a ele**, não um texto a processar. O prompt diz isso literalmente ("'Bom dia' é um cumprimento a ser respondido, não uma expressão a ser explicada") e o primeiro exemplo é justamente esse caso. Exemplos concretos do comportamento desejado pesam mais que regras abstratas.

### 4.9 Contexto temporal explícito

Modelos não sabem que dia é hoje. O backend agora envia a data/hora no fuso do perfil em dois formatos (legível e ISO com offset), e o prompt manda usar isso para "amanhã", "sexta", "daqui a 2 horas", sem perguntar ao usuário. O formato ISO com `-03:00` no contexto ajuda o modelo a produzir `startAt` com o offset certo.

### 4.10 Laço de correção com erros legíveis

Com `neverError: true`, um 400 do backend (por exemplo, "recurrenceMode must be one of HOUR, DAY, WEEK, MONTH") volta como resultado da tool. O prompt instrui: "corrija os dados e tente uma vez mais; se ainda falhar, explique em linguagem simples". Isso transforma a validação do NestJS em feedback para o agente, em vez de uma falha silenciosa.

### 4.11 Temperatura

Para tool calling, respostas mais determinísticas são preferíveis; 0.2 reduz variação nos nomes de operação e nos formatos de data sem tornar a conversa robótica. Se as respostas ficarem secas demais, subir para 0.4 é razoável.

## 5. Como colocar em produção e testar

1. **Backend**: `npm run build` e `npm test` passam. Suba a nova versão (`docker compose up -d --build`).
2. **n8n**: importe [n8n.json](n8n.json) por cima do workflow atual. Confira se a credencial "Header Auth account" está selecionada nos quatro nós de tool e no webhook.
3. **Chave das tools**: a credencial envia um header (normalmente `x-api-key`). O valor precisa ser igual a `WHATSAPP_ADMIN_API_KEY` do `server/.env`. Se a credencial usa a chave do webhook (`ASSISTANT_WORKFLOW_KEY`), ou iguale as duas variáveis, ou crie uma segunda credencial para as tools.
4. **Rede**: as tools apontam para `http://server:3000`. Isso exige o n8n conectado à rede `jarvis-internal` (`docker network connect jarvis-internal n8n`, conforme DEPLOYMENT.md). Se preferir o domínio público, troque a URL nos quatro nós.
5. **Limpe o histórico contaminado** do seu perfil de teste, senão as respostas antigas continuam servindo de exemplo ruim por algumas mensagens:

   ```sql
   DELETE FROM messages WHERE "userId" = '<seu profileId>';
   ```

6. **Casos de teste** (envie pelo WhatsApp e observe a execução no n8n):

   | Mensagem | Esperado |
   |---|---|
   | bom dia | Cumprimento curto, nenhuma tool chamada |
   | me lembra amanhã às 9 de ligar pro dentista | `create_event` com `type: UNIQUE`, `startAt` amanhã 09:00 `-03:00`; confirmação com dia e hora |
   | me lembra de pagar o aluguel | Pergunta o dia e horário, sem chamar tool |
   | todo dia às 8 me lembra de tomar o remédio | `create_event` com `RECURRENCE`, `recurrenceInterval: 1`, `recurrenceMode: DAY` |
   | o que tenho agendado? | `find_active_events`, resposta em lista |
   | cancela o do dentista | `find_active_events` e depois `delete_event` na mesma rodada |
   | gastei 50 no mercado | `finance` com `operation: create_transaction`, `data` com `type: debit` e a data de hoje |
   | quanto gastei esse mês? | `finance` com `list_transactions` filtrando o mês; usa o `summary` |

7. **Itere com evals**: o guia da OpenAI repete que engenharia de prompt é empírica. Guarde os casos acima (e os que falharem) e reteste a cada mudança de prompt ou de modelo. Se o `gpt-oss-120b` ainda hesitar em chamar tools, a estrutura atual funciona igualmente com outros modelos com function calling (troque só o nó de chat model).

## 6. Glossário rápido

- **System prompt**: instruções que definem papel, regras e formato. Vive fora da conversa e tem peso maior que a fala do usuário.
- **Tool / function calling**: o modelo recebe schemas JSON das funções disponíveis e, em vez de responder texto, emite uma chamada estruturada; o orquestrador (n8n) executa e devolve o resultado para o modelo continuar.
- **`$fromAI()`**: mecanismo do n8n para declarar, dentro de um parâmetro de nó, um argumento que o modelo deve preencher; o n8n converte em schema Zod/JSON Schema para a tool.
- **Iterações do agente**: cada volta "pensar, chamar tool, ler resultado" conta uma; `maxIterations` limita o laço.
- **Few-shot / exemplos**: demonstrações no prompt do comportamento esperado. O histórico da conversa funciona como few-shot implícito, daí o efeito de ancoragem.
- **Temperatura**: controla a aleatoriedade da amostragem; baixa = mais previsível.
- **Delimitadores**: marcadores (Markdown, XML) que separam instruções, contexto e dados para o modelo não confundir uma coisa com outra.
