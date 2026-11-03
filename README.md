# Kutuzov JARVIS

Assistente digital especializado no percurso, identidade profissional, experiência, projectos, competências, serviços e filosofia criativa de Edmundo Kutuzov.

**Arquitectura pública:** Gemini 3.8 Flash através de uma função privada no Vercel, com RAG sobre a Knowledge Base pública. O Qwen3/WebGPU fica como modo local de desenvolvimento, não exigido aos visitantes.

> **Estado actual:** os gates automatizados da Fase 9 passaram. A integração Gemini está preparada no código, mas a activação de produção aguarda GEMINI_API_KEY, validação de respostas reais em português e medição de latência/custos. Qwen3/WebGPU fica opcional no desenvolvimento local. A Fase 10 não foi iniciada.

## Objectivo

O JARVIS é um assistente digital especializado no percurso profissional de Kutuzov. Ajuda os visitantes a explorar identidade, experiência, projectos, marcas, competências e serviços, e pode abrir directamente casos de estudo publicados quando o visitante pede essa navegação.

Não é um chatbot genérico, um sistema multiagente ou um clone do ChatGPT.

## Princípios obrigatórios

- **Sem downloads em produção:** os visitantes usam Gemini 3.8 Flash através de uma função server-side no Vercel.
- **Chave protegida:** GEMINI_API_KEY existe apenas no ambiente do servidor; nunca usar VITE_ nem colocar a chave no Git.
- **RAG factual:** Gemini recebe a pergunta, contexto recente limitado e factos públicos recuperados pela Knowledge Base.
- **Desenvolvimento local:** Qwen3/WebGPU permanece como opção de desenvolvimento, não como requisito para o visitante.
- **Factualidade:** a Knowledge Base é a fonte de verdade; cada facto tem origem e estado editorial.
- **Acções limitadas:** o modelo propõe acções tipadas; a aplicação valida schemas. A abertura explícita de um projecto publicado pode navegar para a rota fixa depois de validar o slug e a menção do projecto; as restantes acções exigem confirmação.
- **Privacidade:** o histórico persistente opcional fica no browser e pode ser eliminado. Quando Gemini está activo, a pergunta, contexto recente e factos recuperados são enviados à Google para inferência.
- **Fallback honesto:** sem GEMINI_API_KEY ou perante falha da API, disponibilizar pesquisa determinística, sem fingir que existe inferência.
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
| 7. Memória e privacidade | Implementada e validada por CI; integração com a conversa concluída na Fase 8 |
| 8. Interface conversacional | Implementada e aprovada por CI |
| 9. Testes e optimização final | Gates automatizados aprovados; aceitação física/modelo pendente |
| 10. Preparação da integração | Não iniciada |

A validação automatizada não substitui ensaios físicos. A inferência Gemini em produção não exige que o visitante descarregue Qwen3. O teste físico de WebGPU/Qwen3 mantém-se pendente apenas para o modo local de desenvolvimento. A Fase 10 permanece por iniciar.

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

A integração do ciclo de conversa com `createSession`, `appendMessage` e `getAgentHistory` foi concluída na Fase 8. O chat usa esta memória apenas após consentimento explícito. Os testes de browser verificam IndexedDB real no Chromium, persistência após reload, recuperação de conversas e eliminação.

Consultar [docs/PHASE-7.md](docs/PHASE-7.md).

## Fase 8: Interface conversacional

A interface conversacional foi implementada em src/app/ConversationWorkspace.tsx, com a pesquisa determinística separada em src/app/conversation-utils.ts.

- O chat é a superfície principal da aplicação.
- A biblioteca WebLLM e os pesos do modelo só são carregados após o visitante pedir explicitamente. Abrir a página não importa a biblioteca WebLLM nem descarrega pesos.
- O Agent Core está ligado ao runtime local através de AgentModelPort.
- A resposta só é apresentada depois da validação estruturada e das referências.
- Sem WebGPU ou sem modelo carregado, a aplicação usa pesquisa lexical determinística, apresenta excertos dos registos públicos recuperados e assinala claramente esse modo.
- Cartões de projecto apresentam informação do snapshot público e permitem preparar uma proposta de abertura.
- As nove acções continuam no registry fechado e exigem confirmação explícita no adaptador sandbox.
- O histórico opcional usa o IndexedDB da Fase 7 e pode ser recuperado depois de reload.
- O painel mantém os controlos para consentimento e eliminação completa.
- Não foram adicionadas dependências nem alterado o lockfile.

A interface não está ligada às rotas do website oficial. O estado do adaptador sandbox não representa navegação real. A validação com GPU física e a qualidade semântica do Qwen3 permanecem pendentes para a Fase 9.

Consultar [docs/PHASE-8.md](docs/PHASE-8.md).

## Fase 9: testes e optimização

A Fase 9 acrescenta avaliação quantitativa do retrieval, testes de factualidade estrutural e abstenção, validação de acções inválidas, testes de segurança no browser e budgets do bundle inicial.

- Corpus em português: 11 perguntas sobre identidade, posicionamento, experiência, projectos, clientes, serviços, competências, métricas, restrições editoriais e perguntas sem evidência.
- Retrieval: 11/11 casos; 9/9 factos esperados; 1/1 restrição editorial; 0/2 falsos positivos nos casos sem evidência.
- Testes unitários: 17 ficheiros, 110/110 aprovados.
- Playwright: 44/44 testes em Chromium, Chrome Stable, Edge Stable e WebKit.
- Segurança: payload HTML hostil permanece texto inerte; não foram observados pedidos externos no percurso determinístico testado.
- Budgets iniciais aprovados: HTML 697 bytes; JavaScript 405,310 bytes bruto / 120,200 gzip; CSS 22,282 bytes bruto / 5,253 gzip.

O teste de restrição editorial usa um stub para validar que o contexto chega ao Agent Core e que uma abstenção estruturada é aceite. Não é prova de que o Qwen3 real cumpra a instrução. A comparação de modelos é documental, baseada em metadados publicados, e não em execuções reais.

**Aceitação integral pendente:** Qwen3 em GPU física, download medido, inicialização, first token, tokens/s, memória e revisão humana de respostas em português. Playwright WebKit em Linux não substitui Safari em macOS/iOS. A Fase 10 permanece bloqueada.

Consultar [docs/PHASE-9.md](docs/PHASE-9.md), [docs/MODEL-EVALUATION.md](docs/MODEL-EVALUATION.md) e [docs/PHASE-9-DEVICE-MATRIX.md](docs/PHASE-9-DEVICE-MATRIX.md).

## Quality gates

Último workflow da Fase 9: [JARVIS quality gates, run 41561565406](https://github.com/edmundokutuzov333/kutuzov-jarvis/actions/runs/41561565406). Resultado final: **success**.

Resultados confirmados:
- TypeScript: aprovado.
- ESLint: aprovado.
- Vitest: 17 ficheiros, 110/110 testes aprovados.
- Build de produção: aprovado.
- Budget do bundle inicial: aprovado.
- Playwright: 44/44 testes em Chromium, Chrome Stable, Microsoft Edge Stable e WebKit.
- Dependências: nenhuma nova.
- Lockfile: preservado.

### Tamanhos medidos no build da Fase 9

| Artefacto | Medição | Budget |
|---|---:|---:|
| HTML inicial | 697 bytes | 2,048 bytes |
| JavaScript inicial | 405,310 bytes | 460,800 bytes |
| JavaScript inicial gzip | 120,200 bytes | 138,240 bytes |
| CSS inicial | 22,282 bytes | 25,600 bytes |
| CSS inicial gzip | 5,253 bytes | 6,144 bytes |

Artefactos separados do carregamento inicial:
- Chunk runtime WebLLM: 5,954.23 KB, gzip 2,148.18 KB.
- Worker WebLLM: 6,121.59 KB.
- Peso do modelo não incluído nestes tamanhos e não medido por esta CI.

O HTML inicial não referencia directamente o chunk WebLLM nem o Worker. Os testes de browser confirmam que abrir a interface e conversar sem carregar o modelo não descarrega esses artefactos. O build mantém o aviso de chunks grandes devido à biblioteca WebLLM, mas os budgets do bundle inicial passam.

Os valores não medem tempo de inicialização, first token, tokens/s, RAM ou memória GPU. A aceitação física do modelo continua pendente.

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
├── app/          # workspace conversacional, fallback, painel de privacidade e sandbox
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
├── PHASE-8.md
├── PHASE-9.md
├── MODEL-EVALUATION.md
├── PHASE-9-DEVICE-MATRIX.md
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
- O Action Engine só foi executado no adaptador sandbox. O adaptador real e a navegação do website não estão implementados.
- A interface usa o snapshot de conhecimento e não consulta o CMS em runtime.
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
- [Fase 8: Interface conversacional](docs/PHASE-8.md)
- [Fase 9: testes e optimização](docs/PHASE-9.md)
- [Comparação de modelos](docs/MODEL-EVALUATION.md)
- [Matriz de testes físicos](docs/PHASE-9-DEVICE-MATRIX.md)
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


## Inteligência Gemini

A experiência pública usa a Gemini API através de uma função server-side em `/api/assistant`. O visitante não descarrega os pesos do Qwen3. A função lê a chave apenas de `GEMINI_API_KEY`, executa retrieval sobre a Knowledge Base pública e valida a resposta pelo Agent Core.

- Modelo predefinido: `gemini-3.8-flash`.
- Variáveis de servidor: `GEMINI_API_KEY` obrigatória; `GEMINI_MODEL` opcional.
- Não usar prefixo `VITE_` para a chave e nunca guardar a chave no Git.
- Apenas o tier pago com billing activo é permitido para dados do projecto.
- O histórico continua opcional e local. Quando Gemini está activo, a pergunta e o contexto recente seguem para a API.
- Sem chave configurada em produção, o JARVIS não descarrega um modelo no browser; mantém apenas a pesquisa determinística.
- Pedidos explícitos para abrir um projecto podem abrir automaticamente apenas uma rota fixa `https://www.edmundokutuzov.art/work/{slug}`, após validação do slug publicado.

A Knowledge Base é uma fonte RAG, não fine-tuning. Factos ainda não publicados ou editorialmente pendentes continuam a ser apresentados como desconhecidos.


## Inteligência Gemini e Knowledge Base

A experiência de produção utiliza `gemini-3.8-flash` através de `/api/assistant`, uma função server-side no Vercel. A chave é lida apenas de `GEMINI_API_KEY`; não é incluída nos ficheiros públicos do site.

A base é RAG, não fine-tuning. O Agent Core recupera factos publicados do snapshot, envia apenas esse contexto à Gemini Interactions API com `store: false` e valida a resposta, referências e propostas de acção. Perguntas de perfil completo podem consultar o catálogo público inteiro; perguntas normais usam contexto limitado para reduzir custo e latência.

O histórico persistente continua opcional e local ao browser. Quando Gemini está activa, a pergunta actual e até seis mensagens recentes podem ser enviadas à API. Não introduzir segredos, moradas privadas ou contactos privados.

Pedidos explícitos para abrir um projecto publicado podem abrir automaticamente apenas a rota fixa `https://www.edmundokutuzov.art/work/{slug}`, depois de validar que o slug corresponde ao projecto mencionado. As restantes acções continuam a exigir confirmação.

**Activação pendente:** adicionar `GEMINI_API_KEY` ao projecto Vercel como variável Sensitive/Encrypted para Production e fazer redeploy. O endpoint não revela se a chave está presente, apenas devolve um booleano de disponibilidade. Sem a chave, a produção mantém a pesquisa determinística e não solicita ao visitante que descarregue Qwen3.

Consultar [docs/GEMINI-INTEGRATION.md](docs/GEMINI-INTEGRATION.md).
