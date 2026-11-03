# Registo de decisões técnicas

Este documento separa decisões aceites de hipóteses e selecções provisórias. Actualizar no final de cada fase.

## ADR-0001: execução browser-first
**Estado:** Aceite  
**Decisão:** a inferência deve ocorrer no dispositivo do visitante, recorrendo a WebGPU quando disponível.  
**Motivo:** evitar servidores dedicados, custos de inferência e dependência do computador de Kutuzov.  
**Consequência:** os dispositivos dos visitantes terão requisitos de capacidade diferentes; é obrigatório existir fallback determinístico.

## ADR-0002: sem API de inferência remota
**Estado:** Aceite  
**Decisão:** não utilizar OpenAI API, ChatGPT API ou outros fornecedores de inferência remota.  
**Motivo:** independência de serviços pagos e processamento local das conversas.  
**Consequência:** qualidade e velocidade dependerão do modelo seleccionado e do hardware do visitante.

## ADR-0003: repositório independente
**Estado:** Aceite  
**Decisão:** desenvolver o JARVIS em edmundokutuzov333/kutuzov-jarvis.  
**Motivo:** permitir desenvolver e testar sem colocar em risco o portefólio publicado.  
**Consequência:** a integração só começa após aprovação da versão independente e autorização própria.

## ADR-0004: especialização numa pessoa
**Estado:** Aceite  
**Decisão:** o JARVIS é especializado em Kutuzov, não um assistente de uso geral.  
**Motivo:** reduzir o modelo, o contexto e a complexidade funcional.

## ADR-0005: Knowledge Base com origem verificável
**Estado:** Aceite  
**Decisão:** factos profissionais devem ter origem identificável e estado de verificação.  
**Motivo:** impedir invenção de projectos, clientes, datas, cargos ou resultados.

## ADR-0006: Action Engine com permissões fechadas
**Estado:** Aceite  
**Decisão:** o modelo apenas propõe acções; a aplicação valida e executa comandos registados.  
**Motivo:** impedir execução arbitrária e preservar controlo da interface.

## ADR-0007: voz depois da primeira versão textual
**Estado:** Aceite  
**Decisão:** a primeira versão é textual. Voz será uma fase posterior, opcional e independente.  
**Motivo:** controlar peso, complexidade e qualidade linguística.

## ADR-0008: modelo final ainda não aprovado
**Estado:** Pendente de benchmark  
**Decisão provisória:** Qwen3-0.6B q4f16_1 é o primeiro candidato de prova; Llama 3.2 1B Instruct q4f16_1 é o baseline comparativo.  
**Critério:** a aprovação exige testes de português, factualidade, acções estruturadas, memória, tamanho de download, VRAM, tempo até primeiro token e tokens por segundo em browsers/equipamentos reais.

## ADR-0009: tecnologia de memória
**Estado:** Pendente de implementação  
**Decisão provisória:** histórico local no browser; WebLLM gere o cache dos artefactos de modelo.  
**Critério:** validar IndexedDB e os mecanismos de cache suportados pela versão seleccionada. Tratar armazenamento browser como best-effort, com opção de limpeza e recuperação após eviction.

## ADR-0010: licença do repositório
**Estado:** Pendente de decisão do proprietário  
**Decisão:** não adicionar ficheiro LICENSE até existir decisão explícita sobre a licença de distribuição do código próprio.

## ADR-0011: OpenJarvis como referência, não dependência
**Estado:** Aceite  
**Decisão:** aproveitar apenas conceitos arquitecturais que façam sentido no browser.  
**Motivo:** OpenJarvis é orientado a runtime Python/server e não deve ser copiado integralmente para a aplicação TypeScript.

## ADR-0012: modelo de prova Qwen3-0.6B q4f16_1
**Estado:** Aceite para prova, não para produção  
**Decisão:** usar Qwen3-0.6B q4f16_1 como primeiro candidato a validar. Existe uma biblioteca WebGPU comunitária para WebLLM, mas tem de passar verificação de proveniência, licença, hashes e comportamento no browser.  
**Motivo:** é o candidato mais compacto que apresenta suporte multilingue amplo e licença do modelo Apache 2.0 entre os candidatos investigados.  
**Consequência:** o modelo não será declarado compatível nem aprovado até à prova técnica.

## ADR-0013: Llama 3.2 1B como baseline
**Estado:** Aceite para comparação  
**Decisão:** manter Llama 3.2 1B Instruct q4f16_1 como baseline WebLLM prebuilt.  
**Motivo:** integração mais directa e suporte oficial a português.  
**Consequência:** o tamanho, a estimativa de VRAM e a licença comunitária da Meta tornam-no uma alternativa, não a preferência inicial.

## ADR-0014: acções não dependem de function calling do modelo
**Estado:** Aceite  
**Decisão:** o JARVIS utilizará um Action Router determinístico, registry de acções e schemas validados pela aplicação.  
**Motivo:** a lista actual de modelos WebLLM elegíveis para function calling contém modelos Hermes de 7B/8B, demasiado grandes para a prioridade de leveza; function calling está marcado como WIP.  
**Consequência:** modelos pequenos não terão autoridade autónoma para executar ferramentas.

## ADR-0015: CMS público como fonte profissional
**Estado:** Aceite  
**Decisão:** o conteúdo publicado e visível no CMS é a primeira fonte de verdade para a Knowledge Base.  
**Motivo:** o conteúdo estático de src/lib/content.ts inclui fallbacks e placeholders.  
**Consequência:** a versão independente deve receber um snapshot compacto e verificado; a integração futura é read-only e não cria um segundo CMS.

## ADR-0016: função desempenhada por projecto não inferida
**Estado:** Aceite  
**Decisão:** não atribuir um papel específico a cada projecto até existir um campo ou uma confirmação editorial por projecto.  
**Motivo:** o schema de public.projects não tem campo role e a página actual apresenta Art Direction como texto fixo.  
**Consequência:** o JARVIS deve reconhecer esta ausência e não deduzir autoria ou função a partir da disciplina.

## ADR-0017: conteúdo biográfico em reconciliação
**Estado:** Aceite  
**Decisão:** não fixar uma biografia final a partir de uma única fonte estática enquanto o CMS profile_content.biography estiver vazio e existir conteúdo rich_text/fallback divergente.  
**Motivo:** evitar apresentar como versão oficial uma biografia que o CMS não publicou no campo próprio.  
**Consequência:** a biografia necessita de confirmação editorial antes de entrar como facto permanente na Knowledge Base.

## ADR-0018: fundação React, TypeScript e Vite
**Estado:** Aceite  
**Decisão:** construir a aplicação independente como aplicação estática React + TypeScript + Vite.  
**Motivo:** uma base pequena, tipada, compilável e preparada para execução browser-first, sem introduzir backend.  
**Consequência:** Vite produz os artefactos estáticos; React não carrega WebLLM nesta fase; os módulos de runtime, knowledge, actions e platform mantêm fronteiras separadas.

## ADR-0019: TypeScript estrito e validação de contratos
**Estado:** Aceite  
**Decisão:** utilizar TypeScript strict com verificações adicionais e Zod para validar estruturas de domínio.  
**Motivo:** detectar inconsistências cedo e evitar confiar em dados externos ou em saídas não verificadas.  
**Consequência:** contratos de mensagens são definidos antes do Agent Core e testados sem dependência do browser.

## ADR-0020: lockfile npm versionado e instalação reproduzível
**Estado:** Aceite  
**Decisão:** fixar npm 11.21.1, gerar `package-lock.json` e incorporar o ficheiro na branch `main` apenas depois de os quality gates passarem. O CI utiliza `npm ci --legacy-peer-deps`.  
**Motivo:** tornar a árvore transitiva verificável e reproduzível, sem inventar um lockfile nem o guardar apenas como artefacto temporário.  
**Consequência:** o lockfile fica sob controlo de versão; o workflow regenera-o apenas quando falta e só o incorpora numa execução bem-sucedida de push para `main`.


## ADR-0021: WebLLM 0.2.87 como runtime local
**Estado:** Aceite e implementado  
**Decisão:** utilizar `@mlc-ai/web-llm` na versão exacta 0.2.87, carregado dinamicamente e executado num Web Worker.  
**Motivo:** inferência local em browser com WebGPU, sem servidor de inferência.  
**Consequência:** o pacote de runtime fica fora da entrada inicial e só é importado por acções explícitas do visitante. Os chunks de runtime continuam a ser recursos de download e devem ser medidos separadamente.

## ADR-0022: Qwen3-0.6B q4f16_1 MLC como modelo da prova
**Estado:** Aceite para prova técnica; aprovação de produção pendente de hardware  
**Decisão:** utilizar o Model ID oficial `Qwen3-0.6B-q4f16_1-MLC` que consta do catálogo prebuilt do WebLLM 0.2.87.  
**Motivo:** modelo compacto, quantizado, integrado com a versão fixada do WebLLM e com licença upstream Apache 2.0.  
**Consequência:** o download listado é cerca de 352 MB e a estimativa de VRAM publicada é 1403.34 MB. A compatibilidade real varia por browser e dispositivo.

## ADR-0023: fixação de revisões dos artefactos MLC
**Estado:** Aceite e implementado  
**Decisão:** fixar o repositório de pesos Qwen3 na revisão `8c14ce481d4c692769976ad52afea453a102df19` e a biblioteca WebGPU no commit `146ed9cd4b4062e967b017fd2291f7106b50599f`. A configuração e o tokenizer são verificados com SRI.  
**Motivo:** evitar referências móveis a `main` para os artefactos distribuídos.  
**Consequência:** os ficheiros permanecem alojados em origens externas de distribuição, mas as revisões utilizadas pela aplicação são fixadas. As origens não executam inferência.

## ADR-0024: compatibilidade real WebGPU não inferida de CI headless
**Estado:** Aceite  
**Decisão:** o CI valida o código, o build, o browser e a detecção de capacidade, mas não declara a inferência física aprovada.  
**Motivo:** o ambiente Chromium headless do CI não representa um conjunto de GPUs e não mediu memória ou throughput real.  
**Consequência:** a Fase 3 só fica aceite depois de carregar o modelo e gerar texto num dispositivo físico com WebGPU.

## ADR-0025: retomada de geração não activada sem prova do modelo
**Estado:** Pendente de investigação específica  
**Decisão:** não activar resumable generation nesta fase.  
**Motivo:** a documentação WebLLM indica que a funcionalidade depende de bibliotecas de modelo com primitivas de checkpoint e suporta apenas certos pedidos text-only. A biblioteca binária utilizada ainda não foi demonstrada como checkpoint-capable.  
**Consequência:** o runtime suporta cancelamento e limpeza, mas não afirma retomar uma geração interrompida. Reavaliar após validar suporte do binário e definir a política de sessões.


## ADR-0026: snapshot público tipado como Knowledge Base inicial
**Estado:** Aceite e implementado  
**Decisão:** manter um snapshot local versionado do conteúdo público auditado, validado com Zod, em vez de consultar o CMS em runtime.  
**Motivo:** preservar independência, reduzir dependências e assegurar que o modelo só recebe conteúdo público com origem e estado editorial identificáveis.  
**Consequência:** o catálogo tem 57 factos públicos e 4 restrições editoriais internas, capturados em 2 de Novembro de 2026. A actualização exige nova auditoria/exportação. IDs são locais ao JARVIS e não representam UUIDs do CMS.

## ADR-0027: retrieval lexical antes de embeddings
**Estado:** Aceite e implementado  
**Decisão:** começar com normalização de texto, tokenização, sinónimos PT/EN, correspondência de entidades e ranking determinístico.  
**Motivo:** a base é pequena, o fallback precisa de funcionar sem WebGPU e embeddings acrescentariam tamanho e dependências sem evidência de necessidade.  
**Consequência:** o Agent Core recebe um envelope compacto com factos, restrições e referências. Reavaliar embeddings apenas se uma avaliação de recuperação demonstrar falhas relevantes.

## ADR-0028: separar factos públicos de restrições editoriais
**Estado:** Aceite e implementado  
**Decisão:** registos públicos e guardrails editoriais têm visibilidade e estados de verificação distintos.  
**Motivo:** a biografia, os papéis por projecto, as métricas e os scores de competências não podem ser apresentados sem as respectivas ressalvas.  
**Consequência:** guardrails podem orientar a resposta, mas não entram nas referências de factos públicos nem são apresentados como conteúdo publicado.


## ADR-0029: Agent Core de ciclo único
**Estado:** Aceite e implementado  
**Decisão:** usar uma função de orquestração única que valida a pergunta, recupera contexto, chama um único modelo local e valida uma resposta estruturada.  
**Motivo:** manter o produto especializado e evitar arquitectura multiagente desnecessária.  
**Consequência:** o ciclo pode ser testado e inspeccionado sem criar backend, ferramentas autónomas ou dependências novas.

## ADR-0030: saída JSON com validação estrita após geração
**Estado:** Aceite e implementado; compatibilidade física pendente  
**Decisão:** instruir o modelo para devolver um JSON com status, answer, citationIds e followUpQuestion; validar com Zod e verificar IDs contra as referências recuperadas.  
**Motivo:** não presumir suporte a constrained decoding ou function calling no modelo compacto escolhido.  
**Consequência:** saídas inválidas são rejeitadas. Não há garantia semântica de entailment; a qualidade tem de ser avaliada com Qwen3 em equipamento real.

## ADR-0031: contexto transitório e orçamento de geração do Agent Core
**Estado:** Aceite e implementado  
**Decisão:** limitar pergunta a 2.000 caracteres, histórico a 6 mensagens, contexto recuperado a 3.200 caracteres/6 registos, output do modelo a 12.000 caracteres e geração a 420 tokens como configuração inicial.  
**Motivo:** reduzir prompt injection, custo de contexto e pressão sobre o modelo de 0.6B.  
**Consequência:** histórico não é persistido. Perguntas de seguimento podem usar a última pergunta do visitante para reconstituir o assunto; persistência e eliminação continuam na Fase 7.


## ADR-0032: Action Engine baseado em comandos de domínio fechados
**Estado:** Aceite e implementado  
**Decisão:** expor nove acções com schemas Zod estritos e mapear cada proposta para um HostCommand sem URL ou rota arbitrária.  
**Motivo:** permitir navegação previsível sem conceder acesso ao DOM, ao router ou ao CMS ao modelo.  
**Consequência:** o catálogo actual limita categorias e slugs aos quatro projectos e disciplinas confirmados no snapshot público.

## ADR-0033: confirmação explícita e host como autoridade final
**Estado:** Aceite e implementado  
**Decisão:** nenhuma acção é enviada ao host sem `confirmed: true`; o host recebe apenas um comando já validado e pode rejeitá-lo.  
**Motivo:** separar proposta do modelo de autorização e execução.  
**Consequência:** o futuro UI deve apresentar um controlo de confirmação ao visitante. O clique de teste no sandbox é a confirmação desse ambiente isolado.

## ADR-0034: demo host isolado; sem adaptador real nesta fase
**Estado:** Aceite e implementado  
**Decisão:** usar um DemoPortfolioHostAdapter com estado em memória para validar comandos, sem integrar o portefólio oficial.  
**Motivo:** verificar o contrato sem conhecer ou alterar rotas reais antes da fase de integração autorizada.  
**Consequência:** environment `demo` é explícito; a demonstração não altera site, CMS nem dados publicados. O adaptador de produção fica pendente.

## ADR-0035: proposta de acção no contrato do Agent Core v1.1.0
**Estado:** Aceite e implementado  
**Decisão:** adicionar `actionProposal` ao JSON de saída do Agent Core e um estado `action_proposed` para pedidos explícitos de navegação sem resposta factual.  
**Motivo:** permitir propostas tipadas sem function calling autónomo nem permissões de execução no modelo.  
**Consequência:** o schema valida a proposta, mas a execução continua exclusivamente no Action Engine após confirmação.


## ADR-0036: IndexedDB local e consentimento explícito para histórico
**Estado:** Aceite e implementado  
**Decisão:** persistir sessões e mensagens exclusivamente em IndexedDB, com gravação desactivada por defeito e opção explícita para activar/desactivar.  
**Motivo:** cumprir browser-first, evitar qualquer dependência de backend e dar controlo claro ao visitante.  
**Consequência:** sem consentimento não são criadas sessões nem escritas mensagens. Desactivar suspende novas gravações, mas não apaga os dados já guardados; a eliminação é uma acção separada e destrutiva.

## ADR-0037: limites e separação do contexto conversacional
**Estado:** Aceite e implementado  
**Decisão:** limitar a persistência a 20 sessões, 100 mensagens por sessão e 90 dias; limitar o contexto entregue ao Agent Core a seis mensagens de até 500 caracteres.  
**Motivo:** evitar crescimento ilimitado do armazenamento e respeitar o orçamento de contexto já estabelecido na Fase 5.  
**Consequência:** o histórico persistido serve apenas para continuidade da conversa. Não altera nem complementa a Knowledge Base e não pode ser usado como fonte de citações.

## ADR-0038: eliminação via deleteDatabase e sem preferência residual
**Estado:** Aceite e implementado  
**Decisão:** o comando de eliminação fecha a ligação IndexedDB e elimina a base de dados completa, incluindo a preferência de consentimento.  
**Motivo:** uma eliminação do histórico não deve deixar mensagens, sessões ou preferências relacionadas que aparentem ter sido removidas mas continuem armazenadas.  
**Consequência:** depois da eliminação, o estado regressa a memória desactivada e sem registos. As ligações de outras janelas têm de fechar em `versionchange`; uma janela que bloqueie a eliminação produz erro explícito.
