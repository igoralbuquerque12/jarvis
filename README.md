<div align="center">

# JARVIS

**Assistente pessoal por WhatsApp para lembretes, rotinas e vida financeira.**

Backend NestJS, painel React, agente orquestrado pelo n8n e integração financeira com o Securo.

</div>

## Documentação

A documentação está separada por escopo para evitar instruções de backend e frontend misturadas:

| Escopo | Documento | Conteúdo |
|---|---|---|
| Projeto completo | [Documentação global](docs/README.md) | Visão do produto, arquitetura, fluxos, instalação local, variáveis de ambiente, Docker, deploy e testes. |
| Backend | [Documentação do server](server/README.md) | NestJS, módulos, banco, Redis, APIs, comandos e desenvolvimento do backend. |
| Frontend | [Documentação do web](web/README.md) | React/Vite, páginas, integração com a API, variáveis, comandos e build do frontend. |
| Arquitetura | [Arquitetura detalhada](docs/ARCHITECTURE.md) | Diagramas, modelo de dados, segurança, decisões e trade-offs. |

Os fontes Mermaid e os renders dos diagramas ficam em [`docs/diagrams/`](docs/diagrams/).

## Começando

Para subir o projeto completo localmente, siga o guia [Rodando o projeto](docs/README.md#rodando-o-projeto). Se for trabalhar em somente uma aplicação, use o guia específico do [server](server/README.md#desenvolvimento-local) ou do [web](web/README.md#desenvolvimento-local).

## Estrutura

```text
jarvis/
├── docs/       # documentação global e diagramas
├── server/     # API e serviços de backend
├── web/        # painel web
├── securo/     # motor financeiro
├── compose.yml
└── n8n.json
```
