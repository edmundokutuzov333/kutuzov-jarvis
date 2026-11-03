# Host Adapter Contract

O JARVIS não conhece as rotas internas do portefólio. O Action Engine emite apenas comandos de domínio fechados.

## Comandos

- `projects.show`
- `projects.filter` com categoria permitida
- `projects.open` com slug publicado permitido
- `clients.show`
- `experience.show`
- `services.show`
- `about.open`
- `contact.open`
- `interface.reset`

## Responsabilidade da aplicação anfitriã

Uma implementação real de `HostAdapter` deve:

1. Validar novamente `HostCommandSchema`.
2. Resolver o comando para uma rota/componente interno existente.
3. Revalidar o slug contra os dados públicos carregados no próprio host.
4. Recusar qualquer comando que não corresponda à versão actual da aplicação.
5. Não permitir URLs fornecidas pelo modelo, acesso directo ao DOM ou execução de código.
6. Não escrever no CMS, modificar conteúdos, eliminar dados ou abrir áreas administrativas.
7. Devolver um resultado explícito com environment `portfolio`.

## Estado desta implementação

Existe apenas a interface `HostAdapter` e o `DemoPortfolioHostAdapter` isolado. Não existe adaptador real para `kutuzovportfolio333`. O adaptador real não pode ser criado antes da fase de integração autorizada e da nova auditoria das rotas publicadas.

O adaptador demo mantém estado apenas em memória e identifica o ambiente como `demo`. A demonstração nunca deve ser apresentada como alteração de uma página real.
