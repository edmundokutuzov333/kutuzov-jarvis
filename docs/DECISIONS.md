# Registo de decisões técnicas

Este documento separa decisões já estabelecidas de hipóteses que ainda precisam de investigação.

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

## ADR-0008: modelo ainda não seleccionado
**Estado:** Pendente de investigação  
**Decisão provisória:** comparar modelos compactos realmente suportados pelo WebLLM.  
**Critério:** escolher o mais pequeno que passe a avaliação de português, factualidade, structured output, memória e desempenho. Não fixar modelo ou quantização antes da Fase 1.

## ADR-0009: tecnologia de memória ainda não fixada
**Estado:** Pendente de investigação  
**Decisão provisória:** persistência local no browser, com opção de eliminação.  
**Critério:** escolher o mecanismo mais simples que cumpra os requisitos de privacidade e suporte.

## ADR-0010: licença do repositório
**Estado:** Pendente de decisão do proprietário  
**Decisão:** não adicionar ficheiro LICENSE até existir decisão explícita sobre a licença de distribuição do código próprio.

## ADR-0011: OpenJarvis como referência, não dependência
**Estado:** Aceite  
**Decisão:** aproveitar apenas conceitos arquitecturais que façam sentido no browser.  
**Motivo:** OpenJarvis é orientado a runtime Python/server e não deve ser copiado integralmente para a aplicação TypeScript.
