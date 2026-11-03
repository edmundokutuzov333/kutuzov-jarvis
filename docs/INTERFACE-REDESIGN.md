# Interface redesign

## Direcção visual

A interface do KUTUZOV JARVIS passa de uma página de conversa para um desktop de inteligência pessoal. A direcção combina a linguagem visual do portefólio edmundokutuzov.art com uma metáfora de centro de comando inspirada nas referências visuais fornecidas.

- Base azul-noite e superfícies azul-ardósia.
- Azul eléctrico e azul-gelo como acentos, com texto bone/off-white.
- Tipografia display geométrica, sans e mono técnica, seguindo os tokens do portefólio.
- Núcleo central animado construído em CSS, sem canvas/WebGL adicional.
- Janelas flutuantes para conversa, memória e command center.
- Barra superior, rail de navegação e dock para trazer janelas para a frente ou reabri-las.
- Arrastar janelas pelo cabeçalho com Pointer Events. Em ecrãs estreitos, as janelas passam a uma composição vertical utilizável.

## Fronteiras preservadas

A primeira revisão foi de apresentação e composição, preservando ConversationWorkspace, MemoryPrivacyPanel e ActionEnginePanel. A revisão posterior Gemini acrescenta uma camada server-side e altera a orquestração do Agent Core, mantendo a Knowledge Base, os schemas do Action Registry e a separação do portefólio oficial.

O núcleo visual representa a identidade do assistente; não afirma estado real de inferência. O estado do modelo continua a ser comunicado pelo componente de conversa.

## Performance

A nova camada visual não introduz dependências. O bundle inicial CSS passa a ter um limite de 40 KiB raw / 10 KiB gzip para acomodar a nova composição, mantendo HTML e JavaScript com os limites anteriores. O runtime WebLLM continua fora do carregamento inicial.


## Refinamento visual 02

A segunda revisão removeu a letra central e passou o núcleo a uma esfera de energia abstracta com camadas de plasma, filamentos, partículas, pulsos e órbitas. O núcleo muda de intensidade e velocidade enquanto o assistente prepara uma resposta.

A interface foi simplificada para o visitante: títulos e controlos em português, menos metadados técnicos, descrições curtas e maior hierarquia tipográfica. As janelas mantêm arrastamento por Pointer Events e estados de foco.

## Percepção de velocidade

Para perguntas sem intenção de navegação, o prompt já não inclui o catálogo completo de acções autorizadas. O schema só é incluído quando a pergunta pede explicitamente uma acção. O limite de geração foi reduzido de 420 para 256 tokens e o estilo de resposta passou a privilegiar 1 a 3 frases. Não se alterou o modelo, a localização da inferência ou a política de privacidade. O desempenho real continua dependente do hardware e deverá ser medido em dispositivos físicos.


## Migração Gemini e comportamento de produção

A interface de produção consulta `GET /api/assistant`. Quando o segredo existe, activa Gemini 3.8 Flash e esconde o botão de descarregar o Qwen3. Sem segredo, mantém pesquisa determinística e não pede ao visitante para instalar pesos.

Em desenvolvimento local, o Qwen3 continua disponível como fallback de engenharia. A chave Gemini nunca é enviada ao browser. A função Vercel faz a chamada à API, reutiliza o Agent Core e valida a resposta antes de a mostrar.

Um pedido explícito para abrir um projecto pode navegar directamente para o URL fixo do caso de estudo oficial, apenas quando o slug está no allowlist e o nome do projecto aparece no texto/contexto recente. Os restantes comandos continuam com confirmação.
