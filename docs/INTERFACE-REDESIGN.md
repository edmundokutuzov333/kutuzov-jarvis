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

A alteração é de apresentação e composição. Mantém os componentes existentes ConversationWorkspace, MemoryPrivacyPanel e ActionEnginePanel. Não altera runtime WebLLM, modelo, Knowledge Engine, Agent Core, Action Registry, persistência local ou integração com o portefólio oficial.

O núcleo visual representa a identidade do assistente; não afirma estado real de inferência. O estado do modelo continua a ser comunicado pelo componente de conversa.

## Performance

A nova camada visual não introduz dependências. O bundle inicial CSS passa a ter um limite de 40 KiB raw / 10 KiB gzip para acomodar a nova composição, mantendo HTML e JavaScript com os limites anteriores. O runtime WebLLM continua fora do carregamento inicial.
