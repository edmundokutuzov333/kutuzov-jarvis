# Arquitectura preliminar

**Estado:** revista após a Fase 1. A arquitectura lógica está estabelecida; detalhes de implementação e escolha final do modelo continuam sujeitos à prova técnica.

## 1. Objectivo
O JARVIS é um assistente especializado na informação profissional de Kutuzov. Não é um assistente geral, não é um sistema multiagente e não precisa de um backend de inteligência.

## 2. Princípios
1. A inferência ocorre no dispositivo do visitante.
2. WebGPU é o caminho preferencial quando suportado.
3. O runtime de IA só é carregado depois de o visitante iniciar o assistente.
4. A Knowledge Base contém apenas informação com origem identificável.
5. O contexto enviado ao modelo é pequeno e seleccionado por relevância.
6. O modelo não executa acções directamente.
7. O fallback sem modelo é determinístico.
8. A integração com o portefólio é isolada por um adaptador anfitrião.
9. A fonte de dados profissional é conteúdo público publicado, não arrays estáticos ou placeholders sem reconciliação.

## 3. Componentes lógicos

### Interface do assistente
Responsável pela apresentação, entrada do visitante, estados, mensagens, acessibilidade e feedback. Não importa nem inicializa o runtime de IA na carga inicial.

### Runtime local
Responsável por carregar o modelo escolhido, gerar respostas e gerir streaming, cancelamento e libertação de recursos. A implementação deverá ser lazy-loaded e executada em Web Worker. WebLLM é a base técnica investigada; Qwen3-0.6B q4f16_1 é o primeiro candidato de prova e Llama 3.2 1B q4f16_1 é o baseline prebuilt. Nenhum modelo está aprovado para produção.

### Knowledge Engine
Responsável por consultar os registos profissionais, ordenar resultados e construir um contexto compacto. A pesquisa lexical e por metadados é a primeira hipótese. Embeddings são opcionais e só serão considerados se a avaliação demonstrar necessidade.

### Agent Core
Responsável por organizar a pergunta, recuperar factos, preparar instruções, solicitar a resposta e validar o formato. Não é um sistema multiagente.

### Action Engine
Responsável por validar comandos contra uma lista fechada de acções e schemas. O modelo não executa ferramentas arbitrárias. A aplicação anfitriã valida e executa a acção. A primeira versão deverá usar router de intenções determinístico e Zod, em vez de depender de function calling nativo de modelos pequenos.

### Memória local
Responsável pelo estado e histórico da conversa no dispositivo. A persistência será limitada, transparente e eliminável pelo visitante. A tecnologia concreta será confirmada na implementação. O cache de pesos do WebLLM é separado do histórico da conversa.

### Fallback determinístico
Permite pesquisa e navegação sobre dados disponíveis quando WebGPU ou o modelo não estão disponíveis. Não deve simular respostas geradas por IA.

## 4. Fluxo de pergunta
1. O visitante abre o JARVIS.
2. A interface verifica capacidades do browser e o contexto seguro.
3. O visitante escolhe iniciar o modelo.
4. O runtime WebLLM é carregado dinamicamente e inicializado num Worker.
5. A pergunta é validada.
6. O Knowledge Engine recupera factos relevantes.
7. O Agent Core prepara o contexto limitado.
8. O modelo local gera uma resposta.
9. A resposta estruturada é validada.
10. Se existir uma proposta de navegação, o Action Router valida a intenção e os parâmetros.
11. A aplicação anfitriã executa apenas a acção autorizada.
12. A interface apresenta a resposta e a fonte.

## 5. Dados e fontes
A fonte de verdade profissional é o conteúdo público e publicado do CMS do portefólio, complementado apenas por informação adicional explicitamente confirmada.

Durante desenvolvimento independente, a Knowledge Base deverá ser uma exportação JSON compacta, versionada e com origem/estado de verificação. O CMS não será consultado directamente pelo JARVIS independente nesta fase.

A integração futura poderá usar um adaptador read-only para as queries públicas do CMS ou um snapshot gerado durante build. Não criar um segundo CMS nem expor conteúdo administrativo.

A auditoria do CMS encontrou 4 projectos publicados, 20 clientes visíveis e discrepâncias a resolver na biografia e no papel desempenhado por projecto. Consultar docs/PORTFOLIO-DATA-AUDIT.md.

## 6. Fronteiras de confiança
- Perguntas do visitante: não confiáveis.
- Documentos recuperados: dados, não instruções.
- Saída do modelo: não confiável até ser validada.
- Acções: permitidas apenas por registry e schemas explícitos.
- Knowledge Base: informação de referência, com origem e estado de verificação.
- Adaptador anfitrião: única fronteira entre o JARVIS e a aplicação do portefólio.

## 7. Decisões ainda pendentes
- Benchmark e aprovação final do modelo em equipamentos reais.
- Versão exacta do pacote WebLLM e combinação de model library.
- Origem estática de distribuição e política de espelhamento dos pesos.
- Budget de bundle inicial, tempo de carregamento e memória.
- Estratégia exacta de cache e persistência do histórico.
- Reconciliação editorial da biografia e das funções por projecto.

Nenhuma destas questões deve ser resolvida por suposição.


## 8. Organização técnica implementada na Fase 2

A aplicação independente utiliza React, TypeScript e Vite. O código está separado por fronteiras de responsabilidade:

- `src/app/`: entry point visual e estilos da aplicação.
- `src/domain/`: contratos tipados independentes de browser e UI. O contrato inicial define mensagens de conversa com Zod.
- `src/knowledge/`: fronteira reservada para os registos profissionais verificados e retrieval.
- `src/runtime/`: fronteira reservada para WebLLM, workers e ciclo de vida do modelo.
- `src/actions/`: fronteira reservada para o registry fechado de acções.
- `src/platform/`: fronteira reservada para capacidades do browser, persistência local e adaptação anfitriã.
- `e2e/`: testes de browser com Playwright.

As pastas reservadas contêm apenas documentação de responsabilidade. Não representam funcionalidades já implementadas.

A configuração de TypeScript é estrita e separa código da aplicação da toolchain Node. Vitest executa testes de domínio sem simular browser ou inferência. Playwright valida a aplicação no browser.

A shell visual da Fase 2 é apenas uma fundação técnica e comunica que o modelo, a Knowledge Base e a memória ainda não estão activos.


## 9. Local Intelligence Engine implementado na Fase 3

O runtime local vive em `src/runtime/local-runtime.ts`, com Worker dedicado em `src/runtime/webllm.worker.ts`.

- `src/platform/webgpu.ts` verifica contexto seguro, `navigator.gpu` e o adaptador.
- WebLLM 0.2.87 é importado dinamicamente e inicializado com `CreateWebWorkerMLCEngine` num Worker.
- O modelo oficial é Qwen3-0.6B q4f16_1, com pesos e biblioteca WebGPU fixados a revisões.
- O contexto está limitado a 4096 tokens.
- O runtime comunica progresso, streaming, cancelamento, limpeza de cache e unload.
- A UI não carrega pesos nem chunks de runtime na visita inicial.

A UI indica cerca de 352 MB de ficheiros listados e uma estimativa WebLLM de 1403.34 MB de VRAM. Estes valores não são medições num dispositivo real.

A aceitação final depende de validar a carga e a geração num browser com GPU física. Consultar `docs/PHASE-3.md`.


## 10. Knowledge Engine implementado na Fase 4

A Knowledge Base é um snapshot local do conteúdo público auditado, não uma ligação runtime ao CMS. A implementação está em `src/knowledge/`:

- `schema.ts`: validação Zod do catálogo, registos, fontes, visibilidade e estado editorial.
- `catalog.ts`: 57 factos públicos e 4 restrições editoriais internas, todos com referência à auditoria de 2 de Novembro de 2026.
- `search.ts`: normalização de acentos, tokenização, sinónimos PT/EN, ranking lexical e filtros por categoria.
- `context.ts`: envelope compacto JSON com factos, restrições, referências e estado de ausência de evidência.
- `index.ts`: exports públicos.

O contexto usa até 4.500 caracteres e 6 registos por omissão. As restrições sobre biografia, papéis por projecto, métricas e pontuações de competências ficam separadas dos factos publicados.

A recuperação não executa inferência e pode ser testada sem WebGPU. O envio deste contexto ao Qwen3 e a validação de respostas fundamentadas pertencem ao Agent Core e continuam pendentes da prova física do runtime.


## 12. Agent Core implementado na Fase 5

O Agent Core em `src/agent/` implementa um único ciclo de resposta:

- Valida a pergunta e o histórico com Zod.
- Recupera informação no Knowledge Engine e rejeita correspondências baseadas apenas no nome da pessoa quando o tema não coincide.
- Reconstrói o tópico de perguntas curtas de seguimento usando o histórico transitório recente.
- Constrói um contexto com máximo de 3.200 caracteres e 6 registos.
- Devolve abstenção determinística quando não encontra factos públicos.
- Constrói um pedido JSON com pergunta, histórico não confiável e contexto recuperado.
- Envia um System Prompt versionado ao adaptador local de WebLLM.
- Recebe o streaming internamente, impõe um limite de 12.000 caracteres e valida a saída JSON com Zod.
- Verifica se cada citação pertence ao conjunto de referências públicas recuperadas.

O System Prompt define comportamento e regras. Não contém factos biográficos. O catálogo continua a ser a fonte factual.

O adaptador `createLocalAgentModel` usa o runtime WebLLM existente. O runtime passou a aceitar system prompt e parâmetros limitados de geração, mantendo o carregamento sob pedido e o Worker.

A validação é estrutural, não uma garantia semântica de entailment. Não há constrained decoding confirmado. A qualidade real do Qwen3, obediência JSON, português e factualidade só podem ser aprovados após geração física e benchmark.
