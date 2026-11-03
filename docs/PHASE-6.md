# Fase 6: Action Engine

**Data:** 3 de Novembro de 2026  
**Estado:** Implementação concluída e submetida aos quality gates. A execução real no portefólio está deliberadamente fora desta fase.

## Objectivo

Permitir que o JARVIS proponha comandos de navegação e que a aplicação os valide e encaminhe através de um adaptador anfitrião fechado. O modelo nunca executa directamente acções, navegação ou código.

## Acções permitidas

O registry contém exactamente nove acções:

| ID | Parâmetros permitidos | Comando anfitrião |
|---|---|---|
| `SHOW_PROJECTS` | nenhum | `projects.show` |
| `FILTER_PROJECTS` | `category` em enum fechado | `projects.filter` |
| `OPEN_PROJECT` | `slug` em enum fechado | `projects.open` |
| `SHOW_CLIENTS` | nenhum | `clients.show` |
| `SHOW_EXPERIENCE` | nenhum | `experience.show` |
| `SHOW_SERVICES` | nenhum | `services.show` |
| `SHOW_ABOUT` | nenhum | `about.open` |
| `OPEN_CONTACT` | nenhum | `contact.open` |
| `RESET_INTERFACE` | nenhum | `interface.reset` |

As categorias permitidas correspondem às quatro disciplinas dos projectos publicados no snapshot auditado:
- Campaign Design
- Social Media
- Content Creation
- Art Direction

Os slugs permitidos são exclusivamente:
- `diga-yes`
- `jogue-venca-repita`
- `datas-que-ligam`
- `somos-uma`

Não há parâmetro de URL, rota livre, selector CSS, HTML ou código.

## Schemas e validação

`src/actions/schemas.ts` define:
- Schema discriminado de propostas do modelo.
- Enums de acções, categorias e slugs publicados.
- Schema discriminado de comandos internos do host.
- Contrato dos parâmetros permitidos fornecido ao System Prompt.

`dispatchAction(input, host, { confirmed: true })` executa a validação em runtime:
1. Rejeita IDs de acção desconhecidos.
2. Valida o objecto completo através de Zod e rejeita propriedades extra.
3. Exige confirmação explícita.
4. Converte a proposta num comando interno tipado através de handlers fechados.
5. Entrega apenas o comando tipado ao adaptador anfitrião.
6. Devolve um resultado explícito ou uma rejeição.

Códigos de rejeição: `UNKNOWN_ACTION`, `INVALID_PARAMETERS`, `CONFIRMATION_REQUIRED`, `HOST_REJECTED` e `HOST_FAILURE`.

Todos os handlers estão separados em `src/actions/handlers/`. Não executam efeitos por conta própria: convertem parâmetros validados em comandos de domínio. O adaptador anfitrião é a única fronteira de execução.

## Integração com Agent Core

O contrato estruturado do Agent Core passou para a versão 1.1.0 e inclui o campo `actionProposal`.

A saída pode ser:
- `answered`: resposta factual com referências válidas, com ou sem uma proposta de acção.
- `insufficient_evidence`: sem referências e sem proposta.
- `action_proposed`: pedido explícito de navegação sem resposta factual; exige uma proposta válida e não contém citações.

O modelo recebe o catálogo permitido, as categorias e os slugs. A saída é validada pelo schema da aplicação e não pode incluir acções desconhecidas. Perguntas com pedido claro de navegação podem chegar ao modelo mesmo quando não existe matéria factual para recuperar.

**A proposta não é executada por `runAgentTurn`.** O consumidor tem de apresentar a proposta ao visitante e chamar `dispatchAction` apenas após confirmação explícita.

## Host Adapter

Interface: `src/actions/host/adapter.ts`.

O adaptador recebe apenas `HostCommand`, não a resposta bruta do modelo nem o objecto de entrada do visitante. A aplicação anfitriã deve validar novamente o comando antes de resolver o seu comportamento interno.

### DemoPortfolioHostAdapter

Implementado em `src/actions/host/demo-adapter.ts`.

- Mantém um estado de navegação exclusivamente em memória.
- Executa os nove tipos de comando permitidos num modelo local da interface.
- Regista os comandos enviados na sessão actual.
- Rejeita comandos inválidos mesmo se forem enviados directamente, fora do registry.
- Identifica o ambiente como `demo`.

A consola `ActionEnginePanel` apresenta explicitamente **SANDBOX / DEMO ONLY**. O clique num botão é a confirmação da acção no sandbox. O estado e o registo são locais à própria aplicação independente.

Este adaptador não é um mock de produção e não afirma alterar o portefólio. É um adaptador de demonstração deliberadamente isolado para validar o contrato de integração.

### Adaptador real do portefólio

**Não implementado.** Não foram inspeccionadas ou activadas rotas reais nesta fase; o repositório `kutuzovportfolio333` não foi modificado. A aplicação anfitriã real terá de implementar `HostAdapter`, mapear os comandos para os componentes e rotas actuais, validar o conteúdo público e devolver o resultado. Essa implementação pertence à fase de integração e exige autorização própria.

## Segurança

- Registry fechado de nove IDs.
- Schemas Zod estritos, incluindo parâmetros.
- Categorias e slugs em allowlists de valores auditados.
- Confirmação obrigatória para todos os comandos.
- Nenhuma URL ou rota arbitrária.
- Nenhuma execução de HTML, JavaScript ou código.
- Nenhum acesso ao DOM pelo modelo.
- Nenhuma escrita, publicação ou eliminação no CMS.
- Nenhum acesso ao sistema de ficheiros.
- Host recebe comandos tipados e continua a ser a autoridade final.

A validação do contrato não substitui a validação do host real. Uma implementação de produção tem de validar de novo o slug contra o conjunto de dados públicos disponíveis no momento.

## Testes

Foram preparados testes unitários para:
- Presença e quantidade das nove acções.
- Mapeamento de cada handler para um HostCommand.
- Rejeição de IDs desconhecidos.
- Rejeição de campos adicionais.
- Rejeição de categorias fora da allowlist.
- Rejeição de slugs e parâmetros inválidos.
- Confirmação explícita obrigatória.
- Alteração de estado do demo host.
- Reset do estado sem apagar o registo de eventos.
- Resultado etiquetado como environment `demo`.
- Propostas do Agent Core sem execução automática.
- E2E dos nove botões e estados no browser.

Os testes do adaptador demo provam o contrato e o seu estado em memória, não a navegação do portefólio publicado.

## Resultado e limitações

**Implementado:** schemas, registry, nove handlers, host adapter interface, demo adapter, consola sandbox e ligação de propostas ao contrato do Agent Core.  
**Testado:** validação automatizada e Playwright, a confirmar pelo workflow do commit.  
**Pendente:** qualidade real das propostas produzidas por Qwen3 em GPU física, dependente da aceitação da Fase 3.  
**Não implementado:** adaptador para rotas reais do portefólio, navegação real ou integração no CMS.

A Fase 6 fica implementada e validada pelo ambiente independente. Não declara concluída a integração com o website oficial.
