# Kutuzov JARVIS

Assistente digital especializado no percurso, identidade profissional, experiência, projectos, competências, serviços e filosofia criativa de Edmundo Kutuzov.

**Arquitectura:** browser-first, inteligência local, WebGPU, sem API de inferência remota e sem servidor dedicado.

> **Estado actual:** Fases 0, 1 e 2 concluídas. Fase 3 implementada e validada por CI, mas sem aceitação física WebGPU. Fase 4 implementada e validada por CI; aceitação integrada pendente. Fase 5 implementada e validada por CI; inferência física e avaliação factual pendentes. Fases 6 a 10 ainda não iniciadas.

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
| 4. Knowledge Engine | Implementada e validada por CI; avaliação integrada com modelo pendente |
| 5. Agent Core | Implementada e validada por CI; avaliação real com Qwen3 pendente |
| 6. Action Engine | Não iniciada |
| 7. Memória e privacidade | Não iniciada |
| 8. Interface conversacional | Não iniciada |
| 9. Testes e optimização final | Não iniciada |
| 10. Preparação da integração | Não iniciada |

A Fase 5 foi implementada porque a orquestração, a construção de prompts e a validação de respostas podem ser desenvolvidas e testadas sem inferência física. Isto não elimina o bloqueio de aceitação da Fase 3 nem prova a qualidade real das respostas do modelo.

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

Os guardrails impedem a apresentação de biografia não reconciliada, funções individuais por projecto não confirmadas, métricas como auditorias externas e scores de competências como certificações.

O catálogo é um snapshot de 2 de Novembro de 2026, não uma ligação em tempo real ao CMS.

Consultar [docs/PHASE-4.md](docs/PHASE-4.md).

## Fase 5: Agent Core

Implementado em `src/agent/`:

- Ciclo de conversação de turno único.
- System Prompt versionado, v1.0.0.
- Adaptação do Agent Core ao runtime WebLLM existente.
- Perguntas validadas até 2.000 caracteres.
- Histórico transitório limitado a 6 mensagens.
- Recuperação lexical e filtro de relevância temática.
- Recuperação de contexto em perguntas de seguimento.
- Contexto limitado a 3.200 caracteres e 6 registos.
- Abstenção determinística quando não existe evidência pública.
- Saída JSON com 4 campos: status, answer, citationIds e followUpQuestion.
- Validação Zod e allowlist de referências.
- Rejeição de JSON inválido, citações desconhecidas, HTML e output acima de 12.000 caracteres.
- Cancelamento propagado ao runtime local.

O runtime aceita agora system prompt, limite de tokens, temperature e top-p controlados pela aplicação. O carregamento do modelo continua a ser explícito e executado no Worker.

### Limites da validação

A saída JSON é pedida pelo prompt e validada depois com Zod. Não está demonstrado constrained decoding para a combinação actual de modelo e WebLLM.

A validação de citação confirma que o ID pertence ao conjunto recuperado. Não prova, por si só, que cada frase da resposta é semanticamente sustentada pela fonte. Essa avaliação depende de testes de factualidade com o Qwen3 real.

O Agent Core ainda não está ligado à UI conversacional. Essa integração visual pertence à Fase 8.

Consultar [docs/PHASE-5.md](docs/PHASE-5.md).

## Quality gates

Último workflow: [JARVIS quality gates, run 41489413842](https://github.com/edmundokutuzov333/kutuzov-jarvis/actions/runs/41489413842).

Resultados:
- TypeScript: aprovado.
- ESLint: aprovado.
- Vitest: 10 ficheiros, 66/66 testes aprovados.
- Build de produção: aprovado.
- Playwright Chromium: 2/2 testes aprovados.
- Lockfile: preservado. Não foram adicionadas dependências.

### Tamanhos observados no build

- Entrada JavaScript inicial: 323.85 KB, gzip 99.44 KB.
- CSS: 8.93 KB, gzip 2.53 KB.
- Chunk runtime WebLLM: 5,954.23 KB, gzip 2,148.18 KB.
- Worker WebLLM: 6,121.59 KB.

O build continua a assinalar chunks acima de 500 KB por causa do runtime WebLLM. O teste de browser verifica que os artefactos do modelo e os chunks do runtime não são solicitados na visita inicial.

Estes resultados são de CI. Não representam desempenho ou inferência numa GPU física.

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
├── knowledge/   # schema, catálogo, retrieval, contexto e testes
├── agent/       # prompts, ciclo de conversação, modelo local e validação
├── runtime/     # WebLLM, Worker e ciclo de vida local
├── actions/     # fronteira reservada para acções autorizadas
└── platform/    # WebGPU e capacidades do browser
docs/
├── PHASE-0.md
├── PHASE-1.md
├── PHASE-2.md
├── PHASE-3.md
├── PHASE-4.md
├── PHASE-5.md
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
- Não existe benchmark real de tokens/s, memória GPU ou latência.
- A obediência do modelo ao JSON e a qualidade factual ainda não foram medidas.
- A validação de citações não garante entailment semântico.
- A KB é um snapshot e precisa de nova auditoria quando o CMS mudar.
- A biografia e os papéis por projecto continuam editorialmente pendentes.
- Não existe UI conversacional completa.
- Action Engine e memória persistente não estão implementados.
- Não existe voz.
- Não existe licença de software definida para o código próprio.

## Documentação

- [Fase 0: fundação](docs/PHASE-0.md)
- [Fase 1: investigação e auditorias](docs/PHASE-1.md)
- [Fase 2: fundação técnica](docs/PHASE-2.md)
- [Fase 3: Local Intelligence Engine](docs/PHASE-3.md)
- [Fase 4: Knowledge Engine](docs/PHASE-4.md)
- [Fase 5: Agent Core](docs/PHASE-5.md)
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
