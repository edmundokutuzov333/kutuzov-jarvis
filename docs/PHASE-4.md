# Fase 4: Knowledge Engine

**Data:** 2 de Novembro de 2026  
**Estado:** Implementação determinística concluída. Validação automatizada e aceitação integrada dependem do CI e da prova física WebGPU da Fase 3.

## Objectivo

Construir uma base de conhecimento profissional compacta, com origem e estado editorial explícitos, pesquisa lexical, ranking e preparação de contexto para o modelo local. Não são utilizados embeddings, vector database, servidor ou API externa.

## Fonte e política de dados

O catálogo foi preparado exclusivamente a partir do snapshot público documentado em [docs/PORTFOLIO-DATA-AUDIT.md](./PORTFOLIO-DATA-AUDIT.md), observado em 2 de Novembro de 2026.

A Knowledge Base contém **61 registos**:
- 57 factos públicos derivados do snapshot do CMS.
- 4 restrições editoriais internas, que não são apresentadas como factos públicos.

Distribuição dos factos públicos:
- Identidade e posicionamento: 2.
- Experiência: 5.
- Projectos: 4.
- Clientes/marcas: 20.
- Serviços: 5.
- Competências: 5.
- Grupos de disciplinas: 3.
- Princípios: 4.
- Etapas de processo: 4.
- Métricas publicadas: 5.

### Restrições editoriais incorporadas

1. A biografia não foi consolidada. O campo próprio do perfil estava NULL e existem versões de fallback/rich text divergentes.
2. O papel individual de Kutuzov em cada projecto não está confirmado. A disciplina publicada não é convertida automaticamente em autoria ou responsabilidade.
3. As métricas são declarações apresentadas no portefólio, não auditorias externas.
4. As pontuações de competências são valores do CMS, não resultados de certificação ou avaliação independente.

Os registos internos têm `visibility: internal_guardrail`, `published: false` e `verification: pending_editorial`. São recuperáveis para limitar respostas, mas não entram nas referências de factos públicos.

Não foram adicionados dados de perfil provenientes de memória de conversas, projectos não publicados, dados privados, placeholders, contactos, newsletter ou conteúdo administrativo.

## Implementação

| Ficheiro | Responsabilidade |
|---|---|
| `src/knowledge/schema.ts` | Schemas Zod, enums, proveniência e regras de verificação |
| `src/knowledge/catalog.ts` | Snapshot compacto e versionado do conteúdo auditado |
| `src/knowledge/search.ts` | Normalização, tokenização, sinónimos, ranking e filtros |
| `src/knowledge/context.ts` | Contexto JSON compacto, restrições separadas e referências |
| `src/knowledge/index.ts` | API pública do Knowledge Engine |

### Schema e proveniência

Cada registo tem identificador estável, categoria, título, conteúdo, palavras-chave, entidades, visibilidade, estado de verificação, origem, data do snapshot e metadados tipados.

O catálogo valida:
- Campos obrigatórios e formatos de datas.
- Limites de tamanho.
- Valores permitidos.
- Factos públicos obrigatoriamente publicados e verificados.
- Restrições internas obrigatoriamente não publicadas e pendentes.
- Unicidade dos identificadores.

Os IDs são identificadores internos do JARVIS. A auditoria não forneceu os UUIDs originais de cada linha do CMS, pelo que não são apresentados como IDs nativos do CMS.

### Pesquisa e ranking

A pesquisa é lexical e determinística:
- Normaliza maiúsculas, acentos e pontuação.
- Tokeniza a pergunta, com limite de 50 termos.
- Usa um mapa compacto de sinónimos português/inglês.
- Pondera título, entidades, palavras-chave, conteúdo e metadados.
- Dá bónus a correspondências de frase.
- Ordena por score e aplica desempate estável pelo ID.
- Permite filtrar por categoria.

Por omissão devolve até 6 resultados, com limite máximo configurável de 20 e score mínimo de 1. A pergunta é limitada a 500 caracteres no retrieval.

Não há embeddings nem dependência de modelos adicionais. A estratégia mantém o fallback utilizável quando WebGPU está indisponível.

### Contexto compacto

`buildKnowledgeContext` converte os resultados num envelope JSON:
- Factos públicos em `facts`.
- Restrições editoriais em `constraints`.
- Fontes verificáveis em `references`.
- Estado explícito para evidência encontrada, apenas restrições ou ausência de evidência.
- Indicador de truncagem.
- Contagem exacta de caracteres do envelope serializado.

Orçamento por omissão: 4.500 caracteres e 6 registos. A opção de limite de registos é restringida a um máximo de 12. O contexto ainda não é enviado para o modelo nesta fase; essa orquestração pertence ao Agent Core da Fase 5.

## Testes adicionados

- Validação do catálogo e unicidade de IDs.
- Contagens do snapshot.
- Proveniência de todos os registos.
- Separação entre factos e restrições.
- Protecção contra atribuição automática de funções em projectos.
- Pesquisa com acentos.
- Correspondência por título e entidade.
- Recuperação de experiências, clientes e competências.
- Recuperação da restrição de papel não confirmado.
- Resultado vazio para perguntas sem suporte.
- Limites de contexto, referências e truncagem.

Foram adicionados 21 testes unitários em três ficheiros. Workflow [JARVIS quality gates, run 41472934531](https://github.com/edmundokutuzov333/kutuzov-jarvis/actions/runs/41472934531) concluído com sucesso:
- TypeScript: aprovado.
- ESLint: aprovado.
- Vitest: 6 ficheiros, 39 testes aprovados.
- Build de produção: aprovado.
- Playwright Chromium: 2/2 testes aprovados.
- Lockfile: verificado e preservado.

## Limitações e trabalho pendente

- O catálogo é um snapshot de 2 de Novembro de 2026, não uma ligação viva ao CMS.
- A actualização depende de nova auditoria/exportação read-only e revisão dos dados.
- As descrições completas de cada case study não foram copiadas porque esta auditoria resumida não documenta os respectivos textos.
- Não foram atribuídos papéis individuais aos quatro projectos.
- Não existe ainda integração da recuperação com o ciclo de geração.
- A qualidade factual de respostas produzidas pelo Qwen3 com este contexto ainda não foi medida.
- A Fase 3 continua sem prova de carga e geração em GPU física.

## Resultado

**Implementado:** schema, catálogo, retrieval lexical, ranking, contexto compacto e referências.  
**Testado:** testes unitários e quality gates, a confirmar pelo workflow deste commit.  
**Pendente:** prova de respostas reais com Qwen3 e avaliação factual em equipamento WebGPU.  
**Não iniciado:** Agent Core, acções, memória e integração com o portefólio.

A Fase 4 não é declarada aceite enquanto a integração com o modelo local não for testada e a Fase 3 não tiver prova física registada.
