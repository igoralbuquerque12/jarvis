import { AssistantTool, stringField, uuidField } from './tool.types';

/**
 * The user's text knowledge bases (see database-information/). Two steps,
 * in this order: `search_knowledge` (RAG over every base) always first;
 * `get_database_information` (whole base) only when the search did not
 * answer and a base's description suggests it can help.
 */
export const DATABASE_INFORMATION_TOOL: AssistantTool = {
  name: 'database_information',
  description:
    'Bases de conhecimento em texto que o usuário cadastrou (listas, documentos, anotações, contatos, senhas, rotinas). O conteúdo é pesquisável por busca semântica (search_knowledge) em todas as bases de uma vez; cada base também aparece em <bases_de_conhecimento> com id, nome e descrição e pode ser lida inteira (get_database_information).',
  whenToUse:
    'SEMPRE que uma informação das bases do usuário puder ser útil para responder ou executar o pedido, mesmo que você não tenha certeza de que ela existe. Primeiro busque com search_knowledge; só se a busca não trouxer o necessário e a descrição de alguma base em <bases_de_conhecimento> indicar que ela pode ajudar, leia essa base com get_database_information.',
  operations: [
    {
      name: 'search_knowledge',
      whenToUse:
        'Primeiro passo, SEMPRE: busca os trechos mais relevantes em todas as bases do usuário. Use em qualquer pedido que possa envolver algo pessoal, cadastrado ou específico do usuário (pessoas, contatos, endereços, senhas, documentos, preferências, procedimentos, listas, valores, datas) e sempre que estiver em dúvida se as bases ajudam. Buscar sem necessidade custa pouco; deixar de buscar faz você responder errado.',
      fields: [
        stringField(
          'query',
          'O que procurar, com as palavras-chave que provavelmente aparecem no texto da base (nomes, termos, números). Reescreva o pedido sem pronomes, usando o histórico: "e o dela?" vira "telefone da Ana". Até 500 caracteres.',
        ),
        uuidField(
          'databaseInformationId',
          'Opcional. Id de <bases_de_conhecimento> para buscar só em uma base. Omita para buscar em todas (recomendado).',
          false,
        ),
      ],
      example: { query: 'senha do wifi de casa' },
      notes:
        'Retorna { query, found, results: [{ databaseInformationId, baseName, content }] }; cada content é um trecho que começa com "Base:" e "Seção:". Responda usando apenas os trechos. Se found for false ou os trechos não responderem, tente uma única nova busca com outras palavras e, se ainda não houver, passe para get_database_information quando a descrição de uma base indicar que ela pode ajudar. Bases recém-salvas podem levar alguns segundos para entrar na busca.',
    },
    {
      name: 'get_database_information',
      whenToUse:
        'Segundo passo: ler uma base INTEIRA. Use quando search_knowledge não trouxe o necessário e a descrição de uma base em <bases_de_conhecimento> indicar que ela pode ajudar, ou quando o pedido precisar da base completa (listar tudo, contar itens, resumir a base).',
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
        'Retorna id, name, description e content (o texto integral da base). Responda usando apenas esse conteúdo; se nem a busca nem a base cobrirem a pergunta, diga que não encontrou nas bases dele. Se nenhuma descrição combinar com o pedido, não chame esta operação.',
    },
  ],
};
