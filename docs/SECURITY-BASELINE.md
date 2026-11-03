# Base de segurança e privacidade

**Âmbito:** requisitos de concepção para a primeira versão. Não representa ainda uma auditoria de segurança ou uma certificação.

## Dados e privacidade
- As perguntas e respostas são processadas localmente.
- Não enviar conteúdo de conversas para APIs de IA.
- Não criar telemetria com conteúdo de mensagens.
- O histórico, se persistido, fica no dispositivo do visitante.
- Deve existir uma opção clara para apagar o histórico.
- Não recolher dados pessoais sem necessidade.
- Não armazenar segredos no cliente nem neste repositório.
- A Knowledge Base pública não pode incluir dados administrativos ou privados.

## Modelo e conteúdo
- A saída do modelo é conteúdo não confiável.
- A pergunta do visitante não pode substituir instruções do sistema.
- Documentos recuperados são dados, não instruções executáveis.
- Não executar código ou HTML gerado pelo modelo.
- Não interpretar URLs arbitrárias sugeridas pelo modelo como destinos autorizados.
- Respostas e comandos estruturados devem ser validados antes de renderizar ou executar.

## Ferramentas e acções
- Usar registry fechado.
- Cada ferramenta deve ter schema validado.
- Validar todos os parâmetros.
- Não permitir acesso directo ao DOM pelo modelo.
- Não permitir acesso ao sistema de ficheiros.
- Não permitir escrita no CMS ou na base de dados.
- Não permitir eliminação ou alteração de conteúdos.
- A aplicação anfitriã deve ser a autoridade final para executar acções.

## Browser e runtime
- Detectar suporte antes de tentar inicializar WebGPU.
- Não assumir disponibilidade de GPU ou memória.
- Tratar falhas de inicialização e cancelamento.
- Carregar o runtime apenas sob pedido.
- Validar origem, versão e integridade dos artefactos do modelo.
- Não colocar pesos de modelos no Git.
- Não descarregar modelos silenciosamente.

## Fallback
Quando o modelo não puder ser utilizado, mostrar claramente que o visitante está no modo de pesquisa/navegação determinística. Não representar este modo como uma conversa com IA.

## Verificação futura
A Fase 1/2 deverá transformar estes princípios em controlos técnicos verificáveis. A Fase 9 deverá testar os fluxos de privacidade e segurança.


## Integridade e origem dos artefactos do modelo (Fase 3)

- Fixar a revisão do repositório MLC que fornece os pesos.
- Fixar o commit do repositório de bibliotecas MLC que fornece o WASM.
- Verificar a configuração do modelo e o tokenizer por SRI antes de os aceitar.
- Usar `onFailure: error` para a verificação SRI configurada.
- Não usar URLs `main` para os ficheiros de pesos ou biblioteca fixados no runtime.
- Tratar as origens Hugging Face e GitHub como distribuição de ficheiros estáticos. Não são serviços de inferência.
- Não declarar verificação SHA-256 do WASM pelo runtime: a biblioteca é fixada por commit e Git blob do repositório MLC, mas não está configurado um SRI de conteúdo para esse ficheiro.
- A cache do browser é best-effort. A opção de limpar cache elimina os artefactos WebLLM geridos pelo model ID.

## Limitações de validação

A validação automatizada actual comprova detecção, estados, carregamento sob pedido e ausência de pedidos iniciais. Não comprova que um modelo foi carregado ou executado numa GPU física. O teste real deve registar browser, GPU, tamanho descarregado, memória, tempo de inicialização e resultado de geração.


## Controlos do Agent Core (Fase 5)

- System Prompt versionado e separado da Knowledge Base.
- Pergunta, histórico e documentos recuperados são serializados como dados JSON, nunca concatenados ao System Prompt.
- Histórico aceita apenas roles user/assistant e tem limites de quantidade e tamanho.
- O modelo recebe apenas o contexto seleccionado pelo retrieval.
- O modelo não recebe ferramentas executáveis nem acesso directo ao host. Na Fase 6 recebe apenas o catálogo de propostas tipadas permitidas; cada proposta é validada e exige confirmação antes do dispatch.
- Saída tem schema estrito, campos fechados, limite de tamanho e rejeição de HTML.
- Resposta factual exige pelo menos uma citação.
- Cada ID de citação é validado contra a allowlist de factos públicos recuperados.
- Respostas sem evidência não recebem citações; são substituídas por uma abstenção determinística.
- O streaming é recolhido internamente e não apresentado antes da validação final.
- O pedido de geração é cancelável e os limites de tokens/temperatura/top-p são impostos pela aplicação.

Estes controlos reduzem a superfície de risco, mas não provam que o modelo não possa produzir uma frase semanticamente incorrecta com uma fonte válida. A validação semântica e os testes adversariais no modelo real continuam pendentes para a Fase 9. Não afirmar invulnerabilidade a prompt injection.


## Controlos do Action Engine (Fase 6)

- Registry fechado de nove IDs.
- Schema discriminado de propostas e HostCommands, validado com Zod.
- Propriedades extra e parâmetros inválidos são rejeitados.
- Categorias e slugs limitados a valores presentes no snapshot público auditado.
- Confirmação explícita obrigatória antes do dispatch.
- O modelo apenas devolve `actionProposal`; não recebe uma referência ao host nem ao DOM.
- O dispatcher traduz propostas validadas para comandos internos tipados.
- O host recebe apenas o comando validado e é a autoridade final.
- Não existem URLs, rotas arbitrárias, JavaScript, HTML, acesso ao sistema de ficheiros, escrita no CMS ou eliminação de conteúdos.
- O DemoPortfolioHostAdapter opera apenas num estado em memória, identificado como `demo`.

O adaptador real do portefólio ainda não existe. A aplicação anfitriã terá de validar novamente cada comando e resolver apenas rotas/componentes actualmente autorizados. A aprovação do sandbox não prova a integração nem a segurança das rotas reais.
