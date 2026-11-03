# Base de segurança e privacidade

**Âmbito:** requisitos de concepção para a primeira versão. Não representa ainda uma auditoria de segurança ou uma certificação.

## Dados e privacidade
- Quando `GEMINI_API_KEY` está configurada, a inferência pública é processada pela Gemini API através de uma função privada no Vercel. Sem chave, fica activo apenas o fallback determinístico.
- O browser nunca recebe a chave Gemini; a chave só existe em GEMINI_API_KEY no ambiente do servidor.
- Usar a Gemini Interactions API com `store: false`, sem persistir o pedido como Interaction nos logs da Google.
- Enviar ao Gemini apenas a pergunta, até seis mensagens recentes de contexto e factos públicos seleccionados pela Knowledge Base.
- Usar apenas o tier pago do Gemini com billing activo; não usar a quota gratuita para dados profissionais ou pessoais.
- O histórico opcional continua guardado localmente no browser e não é sincronizado.
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
- A produção utiliza Gemini através de uma função server-side no Vercel.
- A chave Gemini nunca é incluída nos assets do browser ou no Git.
- Qwen3/WebGPU é mantido apenas como opção de desenvolvimento local.
- Quando usado em desenvolvimento, detectar suporte antes de inicializar WebGPU, tratar falhas e carregar pesos apenas sob pedido.
- Validar origem, versão e integridade dos artefactos do modelo local.
- Não colocar pesos de modelos no Git.

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
- Não existem URLs arbitrárias, JavaScript, HTML, acesso ao sistema de ficheiros, escrita no CMS ou eliminação de conteúdos. A única navegação automática é a rota fixa de projecto descrita acima.
- O DemoPortfolioHostAdapter opera apenas num estado em memória, identificado como `demo`.

A integração de navegação directa existe apenas para rotas de detalhe de projectos e não constitui um adaptador completo do portefólio. Os restantes comandos continuam no DemoPortfolioHostAdapter. A aprovação do sandbox não prova a integração nem a segurança das rotas reais.


## Controlos de memória e privacidade (Fase 7)

- IndexedDB é a única persistência das conversas.
- A gravação está desactivada por defeito e exige consentimento explícito.
- A preferência é local e fica no mesmo IndexedDB do histórico.
- Desactivar impede novas gravações, mas não é apresentado como eliminação.
- A eliminação fecha a ligação e remove a base de dados inteira, incluindo sessões, mensagens e preferência.
- Stores separados para sessões, mensagens e configuração.
- Schemas Zod validam registos de sessão, mensagens e preferências lidas/escritas.
- Limites: 20 sessões, 100 mensagens por sessão, retenção de 90 dias, até 2.000 mensagens no total.
- Títulos das sessões são genéricos; não são derivados da pergunta nem guardam identidade do visitante.
- O Agent Core recebe apenas até seis mensagens, com 500 caracteres por mensagem.
- O histórico é contexto transitório, nunca uma fonte de factos profissionais.
- O código de memória não faz chamadas HTTP, não envia eventos e não implementa sincronização.
- Ligações IndexedDB fecham em `versionchange`; erros de bloqueio, indisponibilidade e transacção são expostos ao utilizador.

A prova Playwright de ausência de pedidos externos cobre o fluxo de memória automatizado no Chromium. Não substitui auditoria de rede de todos os fluxos futuros nem prova por si só a privacidade da interface conversacional, que será ligada na Fase 8 e auditada novamente na Fase 9.


- A memória local distingue o erro `QUOTA_EXCEEDED` de falhas genéricas de transacção, apresentando uma instrução para libertar espaço ou apagar histórico.
- A memória é armazenamento local do origin, sem cifragem própria da aplicação. O acesso ao perfil local do browser pode permitir inspeccionar IndexedDB; não guardar segredos ou dados pessoais desnecessários.
- A Fase 7 não adiciona pedidos HTTP, telemetria ou sincronização ao módulo de memória.


## Gemini Cloud (2026-11)

- A chave `GEMINI_API_KEY` é lida exclusivamente pela função `/api/assistant` no servidor Vercel.
- A função não regista prompts, respostas ou histórico em bases de dados. A limitação por IP em memória é best-effort por instância e não substitui um rate limiter distribuído.
- A API aceita apenas pedidos same-origin, valida pergunta/histórico com Zod, aplica limites de tamanho e rejeita métodos diferentes de GET/POST.
- O contexto de factos é construído no servidor a partir de registos publicados e verificados. Guardrails editoriais são enviados como restrições, nunca como factos.
- A resposta Gemini é validada pelo Agent Core; citações têm de pertencer ao contexto recuperado e comandos têm de corresponder a schemas e slugs allowlisted.
- O uso de um tier pago impede que prompts e respostas sejam usados para melhoria de produtos Google, mas não equivale por defeito a zero data retention; verificar os termos e opções de retenção em vigor.
- As conversas não devem incluir segredos, moradas privadas, contactos privados ou outra informação sensível.
