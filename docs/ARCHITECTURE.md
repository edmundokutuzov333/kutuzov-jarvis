# Arquitectura preliminar

**Estado:** orientação arquitectural aceite; detalhes de implementação pendentes da Fase 1.

## 1. Objectivo
O JARVIS é um assistente especializado na informação profissional de Kutuzov. Não é um assistente geral, não é um sistema multiagente e não precisa de um backend de inteligência.

## 2. Princípios
1. A inferência ocorre no dispositivo do visitante.
2. WebGPU é o caminho preferencial quando suportado.
3. O runtime de IA só é carregado depois de o visitante iniciar o assistente.
4. A Knowledge Base contém apenas informação com origem identificável.
5. O contexto enviado ao modelo é pequeno e seleccionado por relevância.
6. O modelo não executa acções directamente.
7. O fallback sem modelo é determinístico.
8. A integração com o portefólio é isolada por um adaptador anfitrião.

## 3. Componentes lógicos

### Interface do assistente
Responsável pela apresentação, entrada do visitante, estados, mensagens, acessibilidade e feedback. Não importa nem inicializa o runtime de IA na carga inicial.

### Runtime local
Responsável por carregar o modelo escolhido, gerar respostas e gerir streaming, cancelamento e libertação de recursos. A implementação deverá ser lazy-loaded e executada fora da thread principal sempre que o runtime escolhido o permitir.

### Knowledge Engine
Responsável por consultar os registos profissionais, ordenar resultados e construir um contexto compacto. A pesquisa lexical e por metadados é a primeira hipótese. Embeddings são opcionais e só serão considerados se a avaliação demonstrar necessidade.

### Agent Core
Responsável por organizar a pergunta, recuperar factos, preparar instruções, solicitar a resposta e validar o formato. Não é um sistema multiagente.

### Action Engine
Responsável por validar comandos contra uma lista fechada de acções e schemas. Os handlers dependem de um adaptador anfitrião. O runtime de modelo não recebe acesso directo ao DOM, ao código da aplicação ou a APIs arbitrárias.

### Memória local
Responsável pelo estado e histórico da conversa no dispositivo. A persistência será limitada, transparente e eliminável pelo visitante. A tecnologia concreta será confirmada na Fase 1/2.

### Fallback determinístico
Permite pesquisa e navegação sobre dados disponíveis quando WebGPU ou o modelo não estão disponíveis. Não deve simular respostas geradas por IA.

## 4. Fluxo de pergunta
1. O visitante abre o JARVIS.
2. A interface verifica capacidades do browser.
3. O visitante escolhe iniciar o modelo local.
4. O runtime é carregado e inicializado.
5. A pergunta é validada.
6. O Knowledge Engine recupera factos relevantes.
7. O Agent Core prepara o contexto limitado.
8. O modelo local gera uma resposta.
9. A resposta estruturada é validada.
10. Se existir uma proposta de acção, o Action Engine valida-a.
11. A interface apresenta a resposta e, quando autorizado, executa a acção.

## 5. Dados e fontes
A fonte de verdade profissional será o conteúdo público e verificado do portefólio, complementado apenas por informação adicional explicitamente confirmada.

O repositório independente pode conter uma exportação compacta e versionada da Knowledge Base. Não deve conter dados administrativos, privados ou conteúdo não publicado.

A sincronização com o CMS não será implementada nesta fase. A futura integração será read-only e será descrita num contrato específico.

## 6. Fronteiras de confiança
- Perguntas do visitante: não confiáveis.
- Documentos recuperados: dados, não instruções.
- Saída do modelo: não confiável até ser validada.
- Acções: permitidas apenas por registry e schemas explícitos.
- Knowledge Base: informação de referência, com origem e estado de verificação.
- Adaptador anfitrião: única fronteira entre o JARVIS e a aplicação do portefólio.

## 7. Questões em aberto
A Fase 1 deverá investigar e documentar:
- Modelo WebLLM mais pequeno que cumpra os testes.
- Tamanho real dos pesos e quantização.
- Requisitos de RAM/VRAM e compatibilidade do browser.
- Suporte a português e qualidade de respostas estruturadas.
- Estratégia de worker compatível com a versão escolhida do WebLLM.
- Cache e persistência dos pesos no browser.
- Estratégia de retrieval mais eficiente.
- Requisitos e limites de desempenho.
- Licenças dos modelos e dependências.

Nenhuma destas questões deve ser resolvida por suposição.
