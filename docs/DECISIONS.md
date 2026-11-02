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
