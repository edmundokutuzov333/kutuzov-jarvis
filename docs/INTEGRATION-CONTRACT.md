# Fronteira de integração com o portefólio

**Estado:** contrato de comandos definido na Fase 6. Adaptador real e integração permanecem fora da fase independente.

## Repositórios separados

- JARVIS independente: edmundokutuzov333/kutuzov-jarvis
- Portefólio oficial: edmundokutuzov333/kutuzovportfolio333

Durante as fases independentes, o repositório do portefólio é apenas fonte de referência em modo de leitura. Não alterar código, dados, configurações, branches ou deployments do portefólio.

## Direcção dos dados

CMS público do portefólio → adaptador de dados → Knowledge Base/runtime JARVIS

O JARVIS não deve escrever no CMS, administrar conteúdo, alterar projectos ou obter dados administrativos.

## Fronteira anfitriã

O contrato `HostAdapter` está em `src/actions/host/adapter.ts`. A aplicação anfitriã deverá implementar:

- `environment: "portfolio"`.
- `dispatch(command: HostCommand)`.
- Validação repetida através de `HostCommandSchema`.
- Resolução dos comandos para rotas/componentes já existentes.
- Verificação dos slugs contra projectos públicos efectivamente disponíveis.
- Resposta explícita de sucesso ou rejeição.

O JARVIS só envia comandos de domínio fechados. Não envia URLs, nomes de ficheiros, seletores DOM ou rotas livres.

## Comandos suportados

- `projects.show`
- `projects.filter` com uma das categorias auditadas.
- `projects.open` com um dos quatro slugs publicados auditados.
- `clients.show`
- `experience.show`
- `services.show`
- `about.open`
- `contact.open`
- `interface.reset`

Os nomes de rotas reais não são assumidos neste contrato. O host deve mapear os comandos para a arquitectura efectiva depois de uma nova auditoria do repositório oficial.

## Proposta e autorização

O Agent Core v1.1.0 pode devolver uma proposta validada em `actionProposal`. A proposta não é executada. A UI tem de a apresentar ao visitante, pedir confirmação explícita e chamar `dispatchAction` apenas depois de o visitante confirmar.

O Action Engine rejeita IDs desconhecidos, parâmetros inválidos, propriedades adicionais e ausência de confirmação.

## Demonstração isolada

`DemoPortfolioHostAdapter` implementa a interface no ambiente independente. Mantém estado em memória e é identificado como `demo`. A consola mostra claramente `SANDBOX / DEMO ONLY`. Não acede ao site publicado, router, CMS ou dados administrativos.

## Regras de integração

- Não duplicar CMS nem base de dados.
- Não enviar dados privados ou administrativos.
- Não criar endpoints de escrita para o JARVIS.
- Não carregar WebLLM antes de o visitante abrir e iniciar o assistente.
- Não executar comandos arbitrários.
- Preservar o router, Shell, estilos e comportamentos existentes.
- Testar navegação, acessibilidade, desempenho e regressões.
- Só integrar depois de a versão independente estar aprovada e existir autorização específica.
