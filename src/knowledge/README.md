# Knowledge Engine

Fase 4 introduz o catálogo público versionado, schemas Zod, recuperação lexical e construção de contexto.

## API

Importar a partir de `src/knowledge/index.ts`:

- `KNOWLEDGE_CATALOG` e `KNOWLEDGE_RECORD_COUNT`
- `searchKnowledge(query, options)`
- `buildKnowledgeContext(question, results, options)`
- Tipos e schemas exportados para integração no Agent Core.

## Política

A fonte actual é o snapshot read-only de conteúdo público documentado em `docs/PORTFOLIO-DATA-AUDIT.md`. O catálogo não consulta o CMS em runtime.

Cada registo tem ID local estável, categoria, conteúdo, palavras-chave, entidades, visibilidade, verificação, metadados e origem. Os IDs locais não são UUIDs originais do CMS.

- `public_fact`: facto visível no snapshot, publicado e verificado contra a auditoria.
- `internal_guardrail`: restrição editorial não publicada, recuperável apenas para impedir afirmações sem suporte.

Não incluir memória de conversas, conteúdo privado, placeholders ou dados administrativos. Não preencher biografia nem papéis por projecto por inferência.

## Retrieval

A pesquisa normaliza acentos e pontuação, aplica sinónimos PT/EN, pontua título, entidades, palavras-chave, conteúdo e metadados, e ordena os resultados de forma estável.

O contexto é um envelope JSON compacto com factos, restrições, referências e estado explícito de evidência. Os limites por omissão são 4.500 caracteres e 6 registos.

Não há embeddings, vector database, API ou processamento remoto. A ligação ao modelo local será feita no Agent Core (Fase 5).

Consultar `docs/PHASE-4.md` para o inventário e limitações.
