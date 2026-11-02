# Fase 2: fundação técnica

**Data:** 2 de Novembro de 2026  
**Estado:** Concluída e validada por GitHub Actions.

## Objectivo

Criar uma aplicação independente, compilável e testável, com React, TypeScript e Vite. Preparar a estrutura modular, testes, lint, build e documentação, sem introduzir ainda o runtime de IA.

## Entregáveis

- [x] React e React DOM configurados.
- [x] Vite configurado para desenvolvimento e build estático.
- [x] TypeScript estrito com project references.
- [x] ESLint flat config com regras JavaScript, TypeScript e React Hooks.
- [x] Vitest configurado para testes de domínio.
- [x] Playwright configurado para browser smoke tests.
- [x] Estrutura de módulos criada para app, domínio, knowledge, runtime, actions e platform.
- [x] Primeiro contrato de mensagens definido com Zod.
- [x] Seis testes unitários para o contrato de mensagens.
- [x] Workflow GitHub Actions para typecheck, lint, testes, build e browser smoke test.
- [x] README e documentação de dependências actualizados.
- [x] package-lock.json gerado, verificado e incorporado na branch main.
- [x] Workflow CI concluído com sucesso.

## Implementação

Stack configurada:
- React 19.3.1 e React DOM 19.3.1.
- TypeScript 5.9.3 em modo strict.
- Vite 8.3.5.
- Zod 4.6.7.
- Vitest 4.1.10.
- Playwright 1.64.1.
- ESLint 10.14.0 e typescript-eslint 8.72.1.

Estrutura:
- `src/app/`: aplicação shell e estilos.
- `src/domain/`: contratos e regras de domínio independentes da UI.
- `src/knowledge/`: fronteira reservada à Knowledge Base e retrieval.
- `src/runtime/`: fronteira reservada ao runtime WebLLM e Workers.
- `src/actions/`: fronteira reservada ao registry de acções.
- `src/platform/`: fronteira reservada às APIs do browser e integração anfitriã.
- `e2e/`: testes de browser.

As pastas reservadas contêm documentação das fronteiras, não funcionalidades simuladas.

## Âmbito deliberadamente excluído

- WebLLM, WebGPU e pesos de modelos.
- Knowledge Base com dados reais.
- Retrieval.
- Agent Core e system prompt final.
- Action Engine funcional.
- IndexedDB e histórico.
- Interface conversacional final.
- Voz.
- Integração com o portefólio.

Estes componentes pertencem às fases seguintes.

## Verificação executada

Workflow: [JARVIS quality gates, run 41464575151](https://github.com/edmundokutuzov333/kutuzov-jarvis/actions/runs/41464575151)

| Gate | Resultado |
|---|---|
| npm lock resolution | Aprovado |
| npm ci | Aprovado |
| TypeScript | Aprovado |
| ESLint | Aprovado |
| Vitest | 1 ficheiro, 6 testes aprovados |
| Build de produção | Aprovado |
| Instalação Chromium | Aprovada |
| Playwright browser smoke test | 1 teste aprovado |
| Commit do lockfile na main | Aprovado |

O primeiro ciclo de CI falhou na geração do lockfile com npm 10.9.2, antes de executar os testes. A toolchain foi fixada em npm 11.21.1 e o pipeline foi repetido com sucesso. O segundo ciclo gerou o lockfile, instalou as dependências e passou todos os gates. O commit automático `build: add npm dependency lockfile` incorporou o ficheiro na branch `main`.

O `package-lock.json` está versionado e a execução validada usou `npm ci --legacy-peer-deps`.

## Resultado

A aplicação independente está configurada, compila e passa os testes automatizados e o smoke test Chromium. A fundação técnica está concluída.

Isto não significa que o assistente já converse, conheça Kutuzov ou execute acções. O runtime de IA, a Knowledge Base, retrieval, Agent Core, Action Engine, memória e experiência conversacional continuam por implementar.

## Próximo passo

**Fase 3: Local Intelligence Engine.** Integrar WebLLM de forma lazy-loaded, iniciar o modelo apenas por pedido explícito do visitante, executar em Worker sempre que suportado, gerir streaming e cancelamento, e manter o modelo fora do carregamento inicial da aplicação.
