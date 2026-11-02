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
