# Action Engine

A Fase 6 introduz um Action Engine fechado para navegação e apresentação de conteúdo. O modelo só propõe uma acção. A aplicação valida o identificador e os parâmetros e exige confirmação explícita antes de enviar um comando tipado ao adaptador anfitrião.

## API

- `ACTION_REGISTRY`: catálogo das nove acções permitidas.
- `dispatchAction(input, host, { confirmed: true })`: valida e despacha uma proposta.
- `PortfolioActionSchema`: schema fechado das propostas do modelo.
- `HostCommandSchema`: contrato fechado de comandos para a aplicação anfitriã.
- `DemoPortfolioHostAdapter`: adaptador isolado para testes e demonstração.

## Acções permitidas

| Acção | Parâmetros |
|---|---|
| `SHOW_PROJECTS` | nenhum |
| `FILTER_PROJECTS` | categoria publicada da allowlist |
| `OPEN_PROJECT` | slug de um dos 4 projectos publicados auditados |
| `SHOW_CLIENTS` | nenhum |
| `SHOW_EXPERIENCE` | nenhum |
| `SHOW_SERVICES` | nenhum |
| `SHOW_ABOUT` | nenhum |
| `OPEN_CONTACT` | nenhum |
| `RESET_INTERFACE` | nenhum |

Categorias autorizadas: Campaign Design, Social Media, Content Creation e Art Direction.

Slugs autorizados: `diga-yes`, `jogue-venca-repita`, `datas-que-ligam` e `somos-uma`.

## Segurança

- Schemas Zod estritos. Propriedades adicionais são rejeitadas.
- Sem URLs, rotas arbitrárias, JavaScript, HTML, DOM, ficheiros ou código executável.
- Não existem comandos de escrita, publicação ou eliminação.
- Confirmação explícita obrigatória antes do dispatch.
- O adaptador anfitrião recebe exclusivamente um `HostCommand` já validado.
- O adaptador anfitrião é a autoridade final e pode rejeitar um comando.
- O Action Engine não executa directamente o DOM nem faz navegação por `window.location`.

## Demonstração isolada

`DemoPortfolioHostAdapter` mantém um estado de navegação em memória e um registo de comandos. A UI identifica expressamente o ambiente como SANDBOX / DEMO. Não representa rotas reais, não consome o CMS em runtime e não altera o portefólio oficial.

O adaptador de produção para `kutuzovportfolio333` não foi criado nem activado nesta fase. A aplicação anfitriã real terá de implementar a interface `HostAdapter`, validar novamente os comandos e resolver as rotas reais após a auditoria de integração.

Consultar `docs/PHASE-6.md` e `docs/INTEGRATION-CONTRACT.md`.
