# Fronteira de integração com o portefólio

**Estado:** contrato preliminar. A implementação fica fora da Fase 0.

## Repositórios separados
- JARVIS independente: edmundokutuzov333/kutuzov-jarvis
- Portefólio oficial: edmundokutuzov333/kutuzovportfolio333

Durante as fases independentes, o repositório do portefólio é apenas fonte de referência em modo de leitura. Não alterar código, dados, configurações, branches ou deployments do portefólio.

## Direcção dos dados
CMS público do portefólio → adaptador de dados → Knowledge Base/runtime JARVIS

O JARVIS não deve escrever no CMS, administrar conteúdo, alterar projectos ou obter dados administrativos.

## Adaptador anfitrião
A aplicação do portefólio será responsável por:
- Fornecer apenas dados públicos e publicados.
- Expor uma lista fechada de acções suportadas.
- Validar os identificadores e parâmetros das acções.
- Executar navegação e alterações de apresentação permitidas.
- Devolver resultados explícitos ao JARVIS.

O JARVIS será responsável por:
- Interpretar a pergunta.
- Consultar o contexto fornecido.
- Propor uma acção compatível com o contrato.
- Apresentar a resposta e referências.

## Acções previstas, sujeitas à auditoria da aplicação anfitriã
- Mostrar projectos.
- Filtrar projectos por categoria.
- Abrir um projecto publicado por slug válido.
- Mostrar clientes e marcas publicados.
- Mostrar experiência pública.
- Mostrar serviços publicados.
- Abrir a página About.
- Abrir a página Contact.

Nenhuma acção é considerada funcional nesta fase. Os nomes, schemas e eventos finais serão definidos após inspeccionar a implementação real do portefólio.

## Regras de integração
- Não duplicar CMS nem base de dados.
- Não enviar dados privados ou administrativos.
- Não criar endpoints de escrita para o JARVIS.
- Não carregar WebLLM antes de o visitante abrir e iniciar o assistente.
- Não executar comandos arbitrários.
- Preservar o router, Shell, estilos e comportamentos existentes.
- Testar navegação, acessibilidade, desempenho e regressões.
- Só integrar depois de a versão independente estar aprovada e existir autorização específica.
