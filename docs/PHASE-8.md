# Fase 8: Interface conversacional

**Data:** 3 de Novembro de 2026  
**Estado inicial:** implementação entregue à CI; aprovação condicionada aos quality gates.

## Objectivo

Substituir a consola técnica temporária por uma experiência conversacional completa no projecto independente, preservando os princípios browser-first, local-first e zero AI API.

## Interface implementada

A aplicação apresenta uma superfície de conversa como ponto central:

- Identidade e estado do assistente.
- Perguntas sugeridas para orientar a primeira utilização.
- Composer com limite de 2.000 caracteres, envio por Enter e quebra de linha por Shift + Enter.
- Estado de verificação WebGPU, modelo não carregado, carregamento, progresso, disponibilidade, erro e libertação de recursos GPU.
- O modelo Qwen3 só é importado e carregado depois de o visitante escolher explicitamente Carregar modelo local.
- Cancelamento de carregamento e de geração.
- Indicador de processamento enquanto o Agent Core prepara e valida uma resposta.
- Rótulo explícito para distinguir inferência local de pesquisa determinística.
- Respostas factuais com referências, identificador do registo e data do snapshot.
- Cartões de projectos com cliente, período, disciplina e comando para preparar a abertura.
- Histórico local, selecção de sessões e criação de nova conversa.
- Comportamento responsivo para desktop, tablet e mobile.
- Focus states, labels, live regions, estados disabled e suporte a movimento reduzido.

A saída em streaming do modelo é mantida no Agent Core até passar a validação JSON, schema e referências. A interface não apresenta conteúdo bruto e não validado do modelo.

## Integração do Agent Core

O composer está ligado a runAgentTurn. O adaptador AgentModelPort encaminha a geração para LocalInferenceRuntime, que continua a executar no Worker local.

- O contexto usa as últimas seis mensagens.
- A Knowledge Base continua a ser a fonte de verdade.
- Só referências presentes no contexto recuperado podem ser apresentadas pelo Agent Core.
- Respostas sem evidência suficiente mantêm a política de abstenção.
- Se o modelo não estiver carregado, ou se a geração/validação falhar, é usada pesquisa determinística.
- O modo determinístico apresenta a pesquisa como pesquisa, nunca como IA.

Não foi adicionado um endpoint, backend ou serviço de inferência remoto.

## Fallback determinístico

Foi adicionado src/app/conversation-utils.ts para pesquisa sem WebGPU/modelo.

O fallback:
- Pesquisa no catálogo local.
- Apresenta apenas registos públicos.
- Gera referências a partir dos metadados da fonte.
- Reconhece comandos determinísticos que correspondem ao registry autorizado.
- Não simula geração linguística nem afirma que está a usar IA.

A detecção de comandos não executa acções. Apenas prepara uma proposta validável.

## Acções e confirmação

As propostas do Agent Core e os comandos reconhecidos no fallback são apresentados como acções pendentes. O visitante tem de confirmar ou recusar.

A execução continua limitada a dispatchAction, schemas estritos e DemoPortfolioHostAdapter. O resultado é identificado como sandbox e altera apenas o estado em memória da demonstração. O portefólio oficial não é navegado nem modificado.

Não foi implementado um adaptador real do portefólio nesta fase. A integração real permanece reservada à Fase 10 e requer autorização específica.

## Memória local

A preferência de histórico do painel de privacidade está ligada ao estado da conversa.

- Desactivado por defeito.
- Quando activado, a pergunta e a resposta são guardadas no IndexedDB local.
- A sessão mais recente pode ser recuperada depois de recarregar a página.
- O visitante pode iniciar uma sessão nova ou seleccionar uma sessão existente.
- Se o armazenamento falhar, a conversa continua temporária e o problema é comunicado.
- Desactivar o histórico impede novas gravações. A eliminação dos dados guardados continua a ser um comando separado.

O catálogo profissional não recebe conteúdo das conversas.

## Ficheiros da fase

- src/app/App.tsx: composição da página e sincronização da preferência de memória.
- src/app/ConversationWorkspace.tsx: interface, ciclo conversacional, modelo, memória e acções.
- src/app/conversation-utils.ts: fallback determinístico e propostas de acção limitadas.
- src/app/conversation-utils.test.ts: testes de pesquisa e comandos determinísticos.
- src/app/MemoryPrivacyPanel.tsx: sincronização do consentimento com a conversa.
- src/app/app.css: sistema visual responsivo e estados de acessibilidade.
- e2e/landing.spec.ts: testes de interface, fallback, memória conversacional e sandbox.
- docs/PHASE-8.md: relatório desta fase.

Não foram adicionadas dependências. O lockfile permanece sem alterações.

## Critérios de aceitação

| Critério | Estado |
|---|---|
| Interface conversacional principal | Implementada |
| Estados do assistente e do modelo | Implementados |
| Cartões de projectos | Implementados |
| Respostas com referências | Implementadas |
| Ligação ao Agent Core local | Implementada |
| Fallback determinístico sem WebGPU/modelo | Implementado |
| Propostas de acção com confirmação | Implementadas |
| Execução limitada ao sandbox | Implementada |
| Memória IndexedDB ligada à conversa | Implementada |
| Responsividade | Implementada |
| Acessibilidade e movimento reduzido | Implementados |
| Testes unitários novos | Implementados; execução CI pendente |
| Testes end-to-end da conversa | Implementados; execução CI pendente |
| Validação em dispositivos reais e GPU física | Pendente, Fase 9 |
| Integração no portefólio oficial | Fora do âmbito, Fase 10 |

## Limitações e riscos conhecidos

- A inferência física com WebGPU não pode ser comprovada apenas pela CI headless. Continua pendente de ensaio em equipamento real.
- Os tamanhos e os requisitos de memória do modelo são os valores listados na documentação da configuração, não medições feitas nesta fase.
- A qualidade semântica das respostas Qwen3 e o seguimento de instruções devem ser avaliados na Fase 9 com perguntas de referência.
- O fallback lexical é intencionalmente limitado. Não interpreta linguagem livre como um LLM.
- As acções são executadas apenas no host sandbox independente.
- As referências apontam para a origem de auditoria incluída no repositório JARVIS, não para uma integração em tempo real com o CMS.
- O histórico não é cifrado por uma camada própria da aplicação. Mantém-se sujeito ao isolamento e à segurança do perfil local do browser, conforme documentado na Fase 7.

## Próxima fase

A Fase 9 deverá executar a suite completa, testar o fluxo em browsers e dispositivos reais, validar qualidade factual e português, inspeccionar privacidade/rede, medir bundle e inferência e corrigir regressões. A aprovação da interface não substitui esses ensaios.
