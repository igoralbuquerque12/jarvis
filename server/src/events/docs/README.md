# Events module

Este módulo cria e executa mensagens agendadas para um `Profile`. A série guarda
a regra do evento; cada execução guarda um disparo concreto, seu estado e o
resultado do envio.

## Diagrama

![alt text](image.png)

## Modelo e regras

- `EventSeries` pertence a um `Profile`, tem tipo `UNIQUE` ou `RECURRENCE`.
- O timezone IANA pertence ao `Profile` e tem `America/Sao_Paulo` como padrão.
- `EventExecution` contém o conteúdo a enviar, `scheduledAt`, estado e o campo
  `observabilitys` para o motivo da falha.
- Estados: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` e `CANCELLED`.
- Toda data agendada é arredondada ao intervalo de 10 minutos mais próximo. Em
  caso de empate, arredonda para frente.
- Eventos recorrentes exigem `recurrenceInterval` positivo e `recurrenceMode`
  (`HOUR`, `DAY`, `WEEK` ou `MONTH`). Após sucesso ou falha, a schedule cria a
  próxima ocorrência estritamente futura.
- Ao terminar um evento `UNIQUE`, sua série fica inativa. Ao deletar uma série,
  ela fica inativa e todas as execuções pendentes passam para `CANCELLED`.

## Endpoints

### `POST /events-m2m/events`

Cria uma série e a primeira execução `PENDING`.

```json
{
  "profileId": "uuid",
  "type": "RECURRENCE",
  "startAt": "2026-07-25T09:05:00-03:00",
  "content": "Verificar novos pedidos",
  "recurrenceInterval": 1,
  "recurrenceMode": "HOUR"
}
```

Para `UNIQUE`, não envie `recurrenceInterval` nem `recurrenceMode`. A resposta
é `{ "eventSeries": {}, "eventExecution": {} }`.

### `DELETE /events-m2m/events/:eventSeriesId`

Desativa a série e cancela suas pendências. Retorna a série e
`cancelledExecutions`.

### `GET /events-m2m/events`

Lista apenas execuções `PENDING` ou `PROCESSING` de séries ativas.

- `profileId=uuid` é obrigatório e restringe a consulta ao perfil.
- `scheduledAt=YYYY-MM-DD` é opcional e filtra o dia calendário no fuso do
  perfil.
- `type=UNIQUE|RECURRENCE` é opcional e pode ser combinado com a data.

### `GET /events-m2m/guideline`

Retorna uma diretriz textual básica para a IA estruturar requisições de evento.

## Endpoints autenticados (web)

Diferente dos `/events-m2m/*` (protegidos apenas pela rede interna), estes
endpoints exigem sessão do better-auth (cookie) e operam sempre sobre o perfil
do usuário logado — o `profileId` nunca vem do cliente.

### `GET /events/me`

Lista execuções `PENDING` ou `PROCESSING` de séries ativas do perfil da sessão,
ordenadas por `scheduledAt`. Cada item traz `id`, `content`, `scheduledAt`,
`status` e `series` (`id`, `type`, `recurrenceInterval`, `recurrenceMode`).

### `DELETE /events/me/series/:seriesId`

Desativa a série e cancela suas pendências, somente se a série pertencer ao
perfil da sessão (caso contrário responde `404`, sem revelar existência).
Retorna `{ "cancelledExecutions": n }`.

## Scheduler

`EventsSchedule` roda a cada 10 minutos. A cada execução, ele consulta um
cache no Redis (chave `events:schedule:pending-cache`, TTL de 2h) contendo
`{ id, scheduledAt }` das execuções `PENDING` de séries ativas dentro da
próxima janela de 2h:

- Se o cache não existe (expirou ou nunca foi criado), consulta o banco,
  monta a lista e grava no Redis com TTL de 2h.
- Se o cache existe, usa a lista do Redis em vez de consultar o banco —
  mesmo que nenhum item esteja vencido ainda, ou que os vencidos já tenham
  sido processados. O banco só é consultado de novo quando o TTL expirar.
- Itens vencidos são removidos do cache (mantendo o TTL original) e seus
  dados completos são buscados no banco pelo `id` para processamento:
  reserva como `PROCESSING`, envia o conteúdo para o `jid` do perfil,
  persiste `COMPLETED` ou `FAILED` e registra falhas em `observabilitys`.

Ao criar um evento (`POST /events-m2m/events`) cujo `startAt` cai dentro das
próximas 2h, o cache é invalidado (`DEL`) imediatamente, forçando a próxima
execução da schedule a reconsultar o banco e incluir o novo evento na janela.

Não há retentativa automática nesta versão.
