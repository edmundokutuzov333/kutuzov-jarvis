# Auditoria do OpenJarvis

**Auditoria em:** 2 de Novembro de 2026  
**Repositório:** https://github.com/open-jarvis/OpenJarvis  
**Commit main observado:** ef8d4593116c1dea43c252cdf86014b04e8abfd3  
**Licença do projecto:** Apache License 2.0  
**Maturidade declarada no pyproject.toml:** Development Status :: 3 - Alpha

## 1. Enquadramento

OpenJarvis é uma framework de investigação e desenvolvimento de assistentes de IA, não apenas uma interface de chat. A arquitectura documentada agrupa capacidades em cinco primitivas: Intelligence, Engine, Agentic Logic, Memory e Learning.

A árvore inspeccionada tinha 2.461 entradas. O repositório contém componentes para agentes, engines locais e cloud, armazenamento, retrieval, segurança, telemetria, traces, servidor, speech, scheduler, canais e ferramentas.

O pyproject.toml declara Python >=3.10 e <3.14. As dependências base incluem, entre outras, click, croniter, datasets, ddgs, httpx, openai, nvidia-ml-py, posthog, psutil, python-telegram-bot, rich, tomlkit e websockets. Os extras opcionais incluem engines MLX/vLLM/cloud, memory FAISS/ColBERT/BM25, servidor FastAPI, desktop, speech, channels, learning, browser e outros.

Esta amplitude é útil para uma framework geral, mas é excessiva para um assistente pessoal executado no browser.

## 2. Componentes relevantes

### SimpleAgent

O SimpleAgent implementa o percurso mais simples: pergunta, construção de mensagens com contexto, chamada ao motor de inferência e resposta. É single-turn e não executa tool calling.

**Decisão para JARVIS:** aproveitar o padrão de ciclo simples. O nosso Agent Core deverá recuperar factos relevantes, montar um prompt compacto, chamar uma vez o modelo e validar a resposta. Não é necessário importar a implementação Python.

### OrchestratorAgent e ReAct

O OrchestratorAgent implementa um loop de tool calling multi-turn, com modos function-calling e structured. O padrão ReAct organiza o fluxo em Thought, Action e Observation.

**Decisão para JARVIS:** não adoptar um orquestrador multi-turn genérico. O JARVIS tem um conjunto pequeno de funções de navegação. Um Action Router determinístico, com schemas tipados e allow-list, será mais leve e previsível. O modelo poderá sugerir a intenção, mas não terá autoridade para executar.

### RetrievalTool e Memory

A RetrievalTool pesquisa um MemoryBackend, selecciona resultados top-k e formata contexto com origem. A framework suporta backends como SQLite/FTS5, FAISS, ColBERT, BM25 e Hybrid. O MemoryService pode extrair factos e persistir memória em background.

**Decisão para JARVIS:** aproveitar a separação entre pergunta, recuperação e resposta, bem como a atribuição de fontes. Não importar SQLite, FAISS, ColBERT, pipelines de embedding ou o serviço de memória do servidor. A Knowledge Base será pequena. Começar por pesquisa lexical e metadados; só adicionar embeddings se os testes justificarem.

### Tool System

OpenJarvis define especificações de ferramentas e execução através de ToolExecutor, com validação e capacidades.

**Decisão para JARVIS:** adoptar o conceito de catálogo fechado de acções, schemas e validação. Reimplementar em TypeScript. O modelo não deve receber acesso directo ao DOM nem executar código.

### Guardrails e Security

O GuardrailsEngine envolve um motor de inferência e executa scanners de secrets e PII. Os modos incluem WARN, REDACT e BLOCK. A própria documentação descreve a camada como composable e opt-in, não como interceptador obrigatório global. O default observado no código é WARN.

**Decisão para JARVIS:** aproveitar os princípios de fronteira de dados e validação. Não assumir que importar o OpenJarvis resolveria a segurança. A aplicação terá de validar entrada, conteúdo recuperado, saída estruturada e parâmetros das acções. O modelo nunca será a fronteira de autorização.

### Traces e eventos

O sistema de traces regista etapas como decisões de routing, retrieval, inferência e tool invocation.

**Decisão para JARVIS:** manter apenas eventos técnicos locais e mínimos para debugging e avaliação. Não criar telemetria remota, não registar conteúdo sensível das conversas e não implementar learning.

## 3. O que aproveitar conceptualmente

| Conceito | Utilização prevista no JARVIS |
|---|---|
| Simple Agent | Ciclo curto de pergunta, contexto e resposta |
| AgentContext | Objecto tipado e limitado com histórico e factos recuperados |
| Retrieval | Recuperação de factos com origem |
| ToolSpec | Contratos de acções e schemas |
| ToolExecutor | Validação e execução pela aplicação anfitriã |
| Guardrails | Fronteiras de confiança e validação |
| Trace lifecycle | Eventos locais mínimos de execução |
| System prompts | Instruções versionadas separadas dos factos |

## 4. O que não importar

Não importar nem instalar:
- Runtime Python do OpenJarvis.
- FastAPI, Uvicorn ou servidor de agentes.
- Engines vLLM, SGLang, Ollama, MLX ou engines cloud.
- SDK OpenAI ou Anthropic.
- Orquestração multiagente.
- Tool sets genéricos para shell, browser, filesystem, SQL, HTTP ou execução de código.
- SQLite/FAISS/ColBERT/BM25 como infraestrutura inicial.
- Scheduler e agentes persistentes.
- Channels e conectores de messaging.
- Speech server, faster-whisper ou Kokoro nesta primeira versão.
- Learning pipelines, SFT, GRPO ou telemetry stores.
- Docker/Podman sandbox para execução de código, porque o JARVIS não deve executar código.

## 5. Licença e reutilização

O OpenJarvis declara Apache 2.0. A licença permite reutilização sob condições, incluindo manter cópia da licença, preservar notices aplicáveis e assinalar ficheiros modificados.

**Nesta auditoria não foi copiado código do OpenJarvis.** As propostas são padrões arquitecturais descritos e reimplementados de forma independente.

Se no futuro for copiado qualquer bloco de código, deverá ser feita uma revisão de origem e licença por ficheiro e adicionados os notices necessários.

## 6. Conclusão

OpenJarvis é útil como referência para decompor o problema em agente, recuperação, contexto, ferramentas e segurança. Não é uma dependência adequada para a arquitectura browser-first do Kutuzov JARVIS. A nossa implementação deve ser muito menor, em TypeScript, sem a infraestrutura Python/server do OpenJarvis.

## Fontes consultadas

- Repositório: https://github.com/open-jarvis/OpenJarvis
- pyproject.toml: https://github.com/open-jarvis/OpenJarvis/blob/main/pyproject.toml
- Licença: https://github.com/open-jarvis/OpenJarvis/blob/main/LICENSE
- Arquitectura: https://open-jarvis.github.io/OpenJarvis/architecture/overview/
- Agentes: https://open-jarvis.github.io/OpenJarvis/architecture/agents/
- Security: https://open-jarvis.github.io/OpenJarvis/architecture/security/
- Quickstart e Memory: https://open-jarvis.github.io/OpenJarvis/getting-started/quickstart/
