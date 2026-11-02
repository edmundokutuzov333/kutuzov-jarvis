# Kutuzov JARVIS

Assistente digital especializado no percurso, identidade profissional, experiência, projectos, competências, serviços e filosofia criativa de Edmundo Kutuzov.

**Arquitectura:** browser-first, inteligência local, WebGPU, sem API de inferência remota e sem servidor dedicado.

> **Estado actual:** Fases 0, 1 e 2 concluídas. Fase 3 implementada e validada por CI, mas sem aceitação física WebGPU. Fase 4 implementada e validada por CI; a integração com o modelo local e a aceitação integrada continuam pendentes. Fases 5 a 10 ainda não iniciadas.

## Objectivo

O JARVIS é um assistente digital especializado numa única pessoa. Deve ajudar os visitantes a conhecer o percurso profissional de Kutuzov, explorar projectos, compreender competências e serviços e, em fases posteriores, navegar pelo portefólio através de acções autorizadas.

Não é um chatbot genérico, um sistema multiagente ou um clone do ChatGPT.

## Princípios obrigatórios

- **Local-first:** a inferência ocorre no dispositivo do visitante através de WebGPU, quando suportado.
- **Zero AI API:** não enviar perguntas ou respostas para OpenAI, Gemini, Claude ou qualquer serviço remoto de inferência.
- **Sem backend de IA:** não depender de servidor dedicado, computador de Kutuzov ou base de dados remota.
- **Carregamento explícito:** runtime e pesos do modelo só são carregados após acção do visitante.
- **Factualidade:** a Knowledge Base é a fonte de verdade; cada facto tem origem e estado editorial.
- **Acções limitadas:** o modelo propõe; a aplicação valida schemas e autoriza handlers registados.
- **Privacidade:** histórico futuro permanece local e tem de ser eliminável.
- **Fallback honesto:** sem modelo, disponibilizar pesquisa determinística, sem fingir que existe inferência.
- **Independência:** o portefólio oficial não é alterado durante as fases independentes.

## Repositórios

- JARVIS: [edmundokutuzov333/kutuzov-jarvis](https://github.com/edmundokutuzov333/kutuzov-jarvis)
- Portefólio oficial, fonte de referência read-only: [edmundokutuzov333/kutuzovportfolio333](https://github.com/edmundokutuzov333/kutuzovportfolio333)

O repositório oficial do portefólio mantém-se separado e não foi alterado nesta fase.

## Estado das fases

| Fase | Estado |
|---|---|
| 0. Fundação do repositório | Concluída |
| 1. Investigação e auditoria | Concluída, com pontos editoriais pendentes |
| 2. Fundação técnica | Concluída e validada por CI |
| 3. Local Intelligence Engine | Implementada e validada por CI; teste real em GPU física pendente |
| 4. Knowledge Engine | Implementada e validada por CI; integração e aceitação com modelo pendentes |
| 5. Agent Core | Não iniciada |
| 6. Action Engine | Não iniciada |
| 7. Memória e privacidade | Não iniciada |
| 8. Interface conversacional | Não iniciada |
| 9. Testes e optimização final | Não iniciada |
| 10. Preparação da integração | Não iniciada |

A implementação de retrieval da Fase 4 pôde avançar separadamente porque é determinística e não inicializa nem depende do WebLLM. Isto não elimina o bloqueio de aceitação física da Fase 3 nem comprova respostas reais do modelo com a Knowledge Base.

## Fase 1: investigação e auditoria

Concluída a auditoria conceptual do OpenJarvis e a auditoria read-only do repositório/CMS do portefólio.

O CMS público foi identificado como primeira fonte de verdade. O snapshot consultado em 2 de Novembro de 2026 registou:
- 4 projectos publicados.
- 20 clientes/marcas visíveis.
- 5 experiências profissionais.
- 5 competências.
- 5 serviços.
- 3 grupos de disciplinas.
- 4 princípios.
- 4 etapas de processo.
- 5 métricas publicadas.

Foram identificadas discrepâncias editoriais na biografia e ausência de um campo de papel individual por projecto. Os detalhes e limites estão em [docs/PORTFOLIO-DATA-AUDIT.md](docs/PORTFOLIO-DATA-AUDIT.md).

## Fase 2: fundação técnica

Aplicação independente em React 19, TypeScript estrito e Vite. Inclui Zod, ESLint, Vitest, Playwright, GitHub Actions e lockfile npm versionado.

O projecto mantém separação entre interface, domínio, knowledge, runtime, actions e platform. O pipeline utiliza `npm ci --legacy-peer-deps`.

## Fase 3: Local Intelligence Engine

Implementado:
- WebLLM 0.2.87, fixado como dependência.
- Modelo de prova Qwen3-0.6B q4f16_1 MLC.
- Verificação de contexto seguro e detecção WebGPU.
- Importação dinâmica de WebLLM.
- Worker dedicado.
- Carregamento sob pedido e progresso.
- Streaming, cancelamento e tratamento de erros.
- Consulta e limpeza da cache.
- Libertação do modelo da memória GPU.

**Modelo de prova:** `Qwen3-0.6B-q4f16_1-MLC`, contexto 4096. Os ficheiros do modelo estão listados em cerca de 352 MB e a configuração WebLLM apresenta uma estimativa de 1403.34 MB de memória GPU. Estes números ainda não foram medidos num dispositivo real.

**Pendente para aceitação:** descarregar e inicializar o modelo num browser com GPU física, gerar texto até ao fim, medir download, tempo de inicialização, tempo até primeiro token, tokens/s, memória e comportamento num dispositivo limitado. O Chromium headless do CI não prova inferência física.

Consultar [docs/PHASE-3.md](docs/PHASE-3.md).

## Fase 4: Knowledge Engine

Implementado em `src/knowledge/`, sem adicionar dependências:

- Schema Zod versionado para catálogo, registos, fontes, visibilidade e verificação.
- Snapshot local de **61 registos**: 57 factos públicos e 4 restrições editoriais internas.
- Identificadores locais estáveis, metadados, origem e data de captura.
- Pesquisa lexical com normalização de acentos e pontuação.
- Sinónimos português/inglês.
- Ranking por título, entidades, palavras-chave, conteúdo e metadados.
- Filtros por categoria.
- Contexto JSON compacto com factos, restrições, referências, estado de evidência e truncagem.
- Orçamento predefinido de 4.500 caracteres e 6 registos por contexto.

### O que a Knowledge Base contém

Os factos públicos abrangem identidade e posicionamento, experiência, projectos, clientes, serviços, competências, disciplinas, princípios, processo e métricas publicadas.

Os quatro guardrails editoriais impedem que o sistema:
1. Apresente uma biografia consolidada antes de reconciliação.
2. Atribua funções individuais aos projectos sem confirmação.
3. Descreva métricas do portefólio como auditorias externas.
4. Trate scores de competências como certificações ou avaliações independentes.

Os IDs são locais ao JARVIS. Não representam UUIDs originais do CMS. O catálogo é um snapshot de 2 de Novembro de 2026, não uma ligação em tempo real ao CMS.

### API do Knowledge Engine

- `searchKnowledge(query, options)`: devolve resultados lexicais ordenados por relevância.
- `buildKnowledgeContext(question, results, options)`: constrói o contexto compacto para o Agent Core.
- `KNOWLEDGE_CATALOG`: catálogo validado.
- `KNOWLEDGE_RECORD_COUNT`: total de registos.

O contexto ainda não está ligado ao ciclo de geração. Essa ligação pertence à Fase 5.

Consultar [docs/PHASE-4.md](docs/PHASE-4.md).

## Quality gates

Último workflow de validação: [JARVIS quality gates, run 41473301298](https://github.com/edmundokutuzov333/kutuzov-jarvis/actions/runs/41473301298).

Resultados:
- TypeScript: aprovado.
- ESLint: aprovado.
- Vitest: 6 ficheiros, 39/39 testes aprovados.
- Build de produção: aprovado.
- Playwright Chromium: 2/2 testes aprovados.
- Lockfile: sincronizado e preservado.

Estes testes validam código, catálogo, retrieval, contexto, build e smoke tests de browser. Não validam inferência WebGPU real nem qualidade de respostas geradas pelo Qwen3.

## Executar localmente

Requisitos: Node.js 22.12.0 ou superior e npm 11.21.1.

```bash
npm ci --legacy-peer-deps
npm run dev
```

Verificações:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Estrutura relevante

```text
src/
├── app/          # shell técnica e painel de teste do motor local
├── domain/       # contratos de conversa
├── knowledge/    # schema, catálogo, retrieval, contexto e testes
├── runtime/      # WebLLM, Worker e ciclo de vida local
├── actions/      # fronteira reservada para acções autorizadas
└── platform/     # WebGPU e capacidades do browser
docs/
├── PHASE-0.md
├── PHASE-1.md
├── PHASE-2.md
├── PHASE-3.md
├── PHASE-4.md
├── ARCHITECTURE.md
├── DECISIONS.md
├── PORTFOLIO-DATA-AUDIT.md
├── OPENJARVIS-AUDIT.md
├── MODEL-RESEARCH.md
├── SECURITY-BASELINE.md
└── INTEGRATION-CONTRACT.md
```

## Limitações actuais

- O modelo ainda não foi validado numa GPU física.
- Não existe ainda benchmark real de tokens/s, memória GPU ou latência.
- O contexto recuperado ainda não está ligado à geração.
- A KB é um snapshot e precisa de nova auditoria quando o CMS mudar.
- A biografia e os papéis por projecto continuam editorialmente pendentes.
- Agent Core, Action Engine, memória, interface conversacional e integração não estão implementados.
- Não existe voz.
- Não existe licença de software definida para o código próprio.

## Documentação

- [Fase 0: fundação](docs/PHASE-0.md)
- [Fase 1: investigação e auditorias](docs/PHASE-1.md)
- [Fase 2: fundação técnica](docs/PHASE-2.md)
- [Fase 3: Local Intelligence Engine](docs/PHASE-3.md)
- [Fase 4: Knowledge Engine](docs/PHASE-4.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Decisões técnicas](docs/DECISIONS.md)
- [Auditoria OpenJarvis](docs/OPENJARVIS-AUDIT.md)
- [Auditoria do CMS e portefólio](docs/PORTFOLIO-DATA-AUDIT.md)
- [Pesquisa WebLLM e modelos](docs/MODEL-RESEARCH.md)
- [Base de segurança](docs/SECURITY-BASELINE.md)
- [Contrato de integração futura](docs/INTEGRATION-CONTRACT.md)
- [Regras para agentes de desenvolvimento](AGENTS.md)

## Licença

Ainda não foi adicionado um ficheiro LICENSE. A licença do código próprio permanece pendente de decisão explícita do proprietário.
