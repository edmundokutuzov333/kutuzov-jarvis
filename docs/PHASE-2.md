# Fase 2: fundação técnica

**Data:** 2 de Novembro de 2026  
**Estado inicial:** Implementação preparada; validação CI pendente.

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
- [x] Testes unitários para o contrato de mensagens.
- [x] Workflow GitHub Actions para typecheck, lint, testes, build e browser smoke test.
- [x] README e documentação de dependências actualizados.
- [ ] Lockfile completo gerado, incorporado e revisto.
- [ ] Workflow CI concluído com sucesso.

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

## Verificação

Os comandos que o CI deverá executar:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. `npm run test:e2e`

O ambiente de execução usado para preparar esta fase não tinha acesso ao registry npm. Por isso, não foi possível executar uma instalação local nem declarar os comandos anteriores como aprovados. O workflow GitHub Actions foi configurado para resolver as dependências, gerar o lockfile se necessário e executar todos os gates.

## Resultado

A aplicação shell e os contratos básicos ficam preparados. O estado só será considerado validado depois de o CI passar e o lockfile ficar incorporado no repositório.

## Próximo passo

**Fase 3: Local Intelligence Engine**, após validação da Fase 2. A integração WebLLM deverá ser lazy-loaded, executada em Worker sempre que suportado, iniciada apenas por pedido do visitante e sem API remota.
