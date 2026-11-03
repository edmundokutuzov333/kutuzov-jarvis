# Kutuzov JARVIS

Assistente digital especializado no percurso, identidade profissional, experiência, projectos, competências, serviços e filosofia criativa de Edmundo Kutuzov.

**Arquitectura:** browser-first, inteligência local, WebGPU, zero API de inferência remota e sem servidor dedicado.

> **Estado actual:** Fases 0 a 6 implementadas e validadas por CI nos respectivos limites documentados. Fase 7 implementada e submetida aos quality gates; integração do histórico na interface conversacional continua pendente da Fase 8. Fases 8 a 10 ainda não iniciadas. A aceitação integrada do modelo continua dependente de inferência física com WebGPU.

## Objectivo

O JARVIS é um assistente digital especializado numa única pessoa. Deve ajudar os visitantes a conhecer o percurso profissional de Kutuzov, explorar projectos, compreender competências e serviços e, numa fase posterior, navegar pelo portefólio através de acções autorizadas.

Não é um chatbot genérico, um sistema multiagente ou um clone do ChatGPT.

## Princípios obrigatórios

- **Local-first:** a inferência ocorre no dispositivo do visitante através de WebGPU, quando suportado.
- **Zero AI API:** não enviar perguntas ou respostas para OpenAI, Gemini, Claude ou qualquer serviço remoto de inferência.
- **Sem backend de IA:** não depender de servidor dedicado, computador de Kutuzov ou base de dados remota.
- **Carregamento explícito:** runtime e pesos do modelo só são carregados após acção explícita do visitante.
- **Factualidade:** a Knowledge Base é a fonte de verdade; cada facto tem origem e estado editorial.
- **Acções limitadas:** o modelo apenas propõe; a aplicação valida schemas, exige confirmação e encaminha comandos para um host autorizado.
- **Privacidade:** histórico futuro permanece local e tem de ser eliminável.
- **Fallback honesto:** sem modelo, disponibilizar pesquisa determinística, sem fingir que existe inferência.
- **Independência:** o portefólio oficial não é alterado durante as fases independentes.

## Repositórios

- JARVIS: [edmundokutuzov333/kutuzov-jarvis](https://github.com/edmundokutuzov333/kutuzov-jarvis)
- Portefólio oficial, fonte de referência read-only: [edmundokutuzov333/kutuzovportfolio333](https://github.com/edmundokutuzov333/kutuzovportfolio333)

O repositório oficial do portefólio continua separado e não foi alterado nesta fase.

## Estado das fases

| Fase | Estado |
|---|---|
| 0. Fundação do repositório | Concluída |
| 1. Investigação e auditoria | Concluída, com pontos editoriais pendentes |
| 2. Fundação técnica | Concluída e validada por CI |
| 3. Local Intelligence Engine | Implementada e validada por CI; teste de inferência em GPU física pendente |
| 4. Knowledge Engine | Implementada e validada por CI; avaliação integrada com modelo real pendente |
| 5. Agent Core | Implementada e validada por CI; avaliação real com Qwen3 pendente |
| 6. Action Engine | Implementada e validada por CI no sandbox; adaptador do portefólio real não implementado |
| 7. Memória e privacidade | Implementada; validação CI desta revisão a confirmar; ligação à UI conversacional pendente |
| 8. Interface conversacional | Não iniciada |
| 9. Testes e optimização final | Não iniciada |
| 10. Preparação da integração | Não iniciada |

A validação automatizada não substitui a execução do modelo numa GPU física. O adaptador sandbox também não prova navegação no website publicado. A Fase 7 implementa persistência local e controlos de privacidade, mas a ligação ao ciclo conversacional só será feita na Fase 8. Estes critérios são separados e continuam pendentes.

## Fase 1: investigação e auditoria

Concluída a auditoria conceptual do OpenJarvis e a auditoria read-only do repositório/CMS do portefólio.

O snapshot do CMS público consultado em 2 de Novembro de 2026 registou:
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

O projecto mantém separação entre interface, domínio, knowledge, agent, runtime, actions e platform. O pipeline utiliza `npm ci --legacy-peer-deps`.

## Fase 3: Local Intelligence Engine

Implementado:
- WebLLM 0.2.87, dependência fixada.
- Modelo de prova Qwen3-0.6B q4f16_1 MLC.
- Detecção WebGPU.
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

Implementado em `src/knowledge/`, sem dependências adicionais:
- Schema Zod versionado para catálogo, registos, fontes, visibilidade e verificação.
- Snapshot local de **61 registos**: 57 factos públicos e 4 restrições editoriais internas.
- IDs locais estáveis, metadados, origem e data de captura.
- Pesquisa lexical com normalização de acentos e pontuação.
- Sinónimos português/inglês.
- Ranking por título, entidades, palavras-chave, conteúdo e metadados.
- Filtros por categoria.
- Contexto JSON compacto com factos, restrições, referências, estado de evidência e truncagem.
- Orçamento predefinido de 4.500 caracteres e 6 registos.

Os guardrails impedem a apresentação de biografia não reconciliada, funções individuais por projecto não confirmadas, métricas como auditorias externas e pontuações de competências como certificações.

O catálogo é um snapshot de 2 de Novembro de 2026, não uma ligação em tempo real ao CMS.

Consultar [docs/PHASE-4.md](docs/PHASE-4.md).

## Fase 5: Agent Core

Implementado em `src/agent/`:
- Ciclo de conversação de turno único.
- System Prompt versionado, actualmente v1.1.0.
- Adaptador para o runtime WebLLM.
- Perguntas até 2.000 caracteres.
- Histórico transitório limitado a 6 mensagens.
- Recuperação lexical, filtro de relevância e resolução de perguntas de seguimento.
- Contexto até 3.200 caracteres e 6 registos.
- Abstenção determinística quando não existe evidência pública.
- Saída JSON validada com Zod.
- Referências verificadas contra a allowlist recuperada.
- Rejeição de JSON inválido, citações desconhecidas, HTML e output acima de 12.000 caracteres.
- Cancelamento propagado ao runtime local.

O contrato v1.1.0 inclui `actionProposal` e o estado `action_proposed`. A proposta é inerte: o Agent Core não a executa nem recebe o adaptador anfitrião.

A validação confirma que as citações pertencem ao conjunto recuperado, mas não prova que cada frase está semanticamente sustentada pela fonte. A qualidade factual com Qwen3 real ainda não foi medida.

Consultar [docs/PHASE-5.md](docs/PHASE-5.md).

## Fase 6: Action Engine

Implementado em `src/actions/`, sem dependências novas.

### Registry fechado

O registry contém exactamente nove acções:
- `SHOW_PROJECTS`
- `FILTER_PROJECTS`
- `OPEN_PROJECT`
- `SHOW_CLIENTS`
- `SHOW_EXPERIENCE`
- `SHOW_SERVICES`
- `SHOW_ABOUT`
- `OPEN_CONTACT`
- `RESET_INTERFACE`

As categorias de filtro estão limitadas a Campaign Design, Social Media, Content Creation e Art Direction. Os slugs de abertura estão limitados aos quatro projectos publicados auditados:
- `diga-yes`
- `jogue-venca-repita`
- `datas-que-ligam`
- `somos-uma`

### Validação e autorização

- Propostas e comandos anfitriões têm schemas Zod estritos.
- IDs desconhecidos, propriedades extra, categorias e slugs inválidos são rejeitados.
- A aplicação exige confirmação explícita antes do dispatch.
- Os handlers convertem propostas validadas em comandos de domínio tipados.
- O host recebe apenas o comando tipado, não a saída bruta do modelo.
- Não existem URLs livres, execução de HTML/JavaScript, acesso ao DOM, escrita no CMS ou eliminação de conteúdos.

### Adaptador anfitrião

Existe a interface `HostAdapter` e um `DemoPortfolioHostAdapter` isolado. O adaptador demo altera apenas estado em memória, regista eventos e identifica o ambiente como `demo`.

A consola de demonstração apresenta sempre **SANDBOX / DEMO ONLY**. Cada botão é uma aprovação explícita para executar o comando no sandbox.

**Não existe adaptador real para o website oficial.** Nenhuma rota real foi aberta ou alterada. O repositório do portefólio não foi modificado. A integração de produção exigirá uma nova auditoria do router e componentes anfitriões, bem como autorização própria.

Consultar [docs/PHASE-6.md](docs/PHASE-6.md), [src/actions/README.md](src/actions/README.md) e [docs/INTEGRATION-CONTRACT.md](docs/INTEGRATION-CONTRACT.md).


## Fase 7: Memória e privacidade

Implementado em `src/memory/`, sem dependências novas.

- IndexedDB local, com stores separados para sessões, mensagens e consentimento.
- Histórico desligado por defeito e activado apenas por escolha explícita do visitante.
- Desactivar impede novas gravações, mas mantém os registos existentes até eliminação.
- Título de sessão genérico, sem derivar conteúdo da conversa.
- Limites: 20 sessões, 100 mensagens por sessão, até 2.000 mensagens no total.
- Retenção de 90 dias, aplicada ao consultar o estado e ao criar sessões.
- Mensagens validadas com os schemas de conversa existentes.
- `getAgentHistory` limita o contexto às últimas 6 mensagens, com 500 caracteres por mensagem.
- Eliminação fecha as ligações e remove a base de dados IndexedDB completa, incluindo a preferência.
- Sem localStorage, backend, sincronização, telemetria ou chamadas HTTP no módulo de memória.
- Painel de privacidade responsivo, com consentimento, contagem de dados e eliminação com confirmação.

O serviço está disponível para a Fase 8, mas ainda não existe interface de chat. A integração do ciclo de conversa com `createSession`, `appendMessage` e `getAgentHistory` será feita nessa fase. Os testes de browser verificam IndexedDB real no Chromium, persistência após reload e eliminação. A CI desta implementação será indicada no relatório final da fase.

Consultar [docs/PHASE-7.md](docs/PHASE-7.md).

## Quality gates

Último workflow da Fase 6: [JARVIS quality gates, run 41554009167](https://github.com/edmundokutuzov333/kutuzov-jarvis/actions/runs/41554009167).

Resultados:
- TypeScript: aprovado.
- ESLint: aprovado.
- Vitest: 13 ficheiros, 86/86 testes aprovados.
- Build de produção: aprovado.
- Playwright Chromium: 3/3 testes aprovados.
- Lockfile: preservado. Não foram adicionadas dependências.

### Tamanhos observados no build

- Entrada JavaScript inicial: 337.01 KB, gzip 102.76 KB.
- CSS: 11.73 KB, gzip 2.95 KB.
- Chunk runtime WebLLM: 5,954.23 KB, gzip 2,148.18 KB.
- Worker WebLLM: 6,121.59 KB.

O build continua a avisar sobre chunks acima de 500 KB devido ao runtime WebLLM. O runtime e os pesos não são carregados na visita inicial. Estes números são medições do build, não benchmarks de inferência ou memória numa GPU física.

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
├── app/          # shell técnica, painel WebLLM e consola sandbox
├── domain/       # contratos de conversa
├── knowledge/    # schema, catálogo, retrieval, contexto e testes
├── agent/        # prompts, ciclo de conversação, modelo local e validação
├── runtime/      # WebLLM, Worker e ciclo de vida local
├── actions/      # registry, schemas, handlers e host adapter
├── memory/       # IndexedDB, sessões, histórico e políticas de contexto
└── platform/     # WebGPU e capacidades do browser
docs/
├── PHASE-0.md
├── PHASE-1.md
├── PHASE-2.md
├── PHASE-3.md
├── PHASE-4.md
├── PHASE-5.md
├── PHASE-6.md
├── PHASE-7.md
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
- A obediência do Qwen3 ao JSON, português e propostas de acção ainda não foi medida no hardware real.
- A validação de citações não garante entailment semântico.
- A Knowledge Base é um snapshot e precisa de nova auditoria quando o CMS mudar.
- A biografia e os papéis por projecto continuam editorialmente pendentes.
- Não existe interface conversacional completa nem fluxo de confirmação de propostas geradas pelo modelo ligado ao utilizador.
- O Action Engine só foi executado no adaptador sandbox. O adaptador real e a navegação do website não estão implementados.
- A persistência e os controlos de memória local estão implementados. A ligação ao chat ainda não existe porque a interface conversacional pertence à Fase 8.
- Voz, optimização final e integração não estão implementadas.
- Não existe licença de software definida para o código próprio.

## Documentação

- [Fase 0: fundação](docs/PHASE-0.md)
- [Fase 1: investigação e auditorias](docs/PHASE-1.md)
- [Fase 2: fundação técnica](docs/PHASE-2.md)
- [Fase 3: Local Intelligence Engine](docs/PHASE-3.md)
- [Fase 4: Knowledge Engine](docs/PHASE-4.md)
- [Fase 5: Agent Core](docs/PHASE-5.md)
- [Fase 6: Action Engine](docs/PHASE-6.md)
- [Fase 7: Memória e privacidade](docs/PHASE-7.md)
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
