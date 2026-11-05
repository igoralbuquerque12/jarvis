import { AssistantTool, uuidField } from './tool.types';

/** The user's text knowledge bases (see database-information/). */
export const DATABASE_INFORMATION_TOOL: AssistantTool = {
  name: 'database_information',
  description:
    'Bases de conhecimento em texto que o usuário cadastrou (listas, documentos, anotações). Cada base aparece em <bases_de_conhecimento> com id, nome e descrição; o conteúdo só pode ser obtido por esta ferramenta.',
  whenToUse:
    'Quando o pedido do usuário puder ser respondido por alguma base listada em <bases_de_conhecimento>, escolhida pela descrição.',
  operations: [
    {
      name: 'get_database_information',
      whenToUse:
        'Ler o conteúdo de uma base de <bases_de_conhecimento> para responder ao usuário.',
      fields: [
        uuidField(
          'databaseInformationId',
          'Id da base, copiado de <bases_de_conhecimento>.',
        ),
      ],
      example: {
        databaseInformationId: '5f0c2b3e-8f7a-4d0e-9a3b-2c1d4e5f6a7b',
      },
      notes:
        'Retorna id, name, description e content (o texto integral da base). Responda usando apenas esse conteúdo; se ele não cobrir a pergunta, diga que não encontrou na base. Se nenhuma base listada combinar com o pedido, não chame a ferramenta.',
    },
  ],
};
