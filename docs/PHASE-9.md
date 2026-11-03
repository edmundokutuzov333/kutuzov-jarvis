# Fase 9: testes e optimização

**Data:** 3 de Novembro de 2026  
**Estado final:** gates automatizados aprovados na CI; aceitação integral ainda bloqueada por ensaio físico de WebGPU/Qwen3 e avaliação de respostas reais. Workflow [run 41561565406](https://github.com/edmundokutuzov333/kutuzov-jarvis/actions/runs/41561565406) concluído com sucesso.

## Objectivo

Executar uma avaliação sistemática do retrieval, factualidade estrutural, abstenção, limites editoriais, segurança da interface, privacidade de rede, compatibilidade de motores de browser e desempenho de carregamento inicial. Separar resultados automatizados de afirmações que exigem inferência real em GPU.

## Avaliação do Knowledge Engine

Foi criado um corpus de 11 perguntas em português em `src/evaluation/knowledge-benchmark.ts`:
- Identidade e cargo publicados.
- Posicionamento.
- Experiência profissional.
- Projecto publicado, cliente, ano e disciplina.
- Relação pública com cliente/marca.
- Serviço.
- Competência e pontuação publicada.
- Métrica apresentada no portefólio.
- Papel individual num projecto não confirmado, com recuperação da restrição editorial.
- Prémio inexistente no snapshot.
- Dados pessoais privados sem evidência pública.

O benchmark mede retrieval determinístico e recuperação de restrições, não qualidade do texto produzido por um LLM. As métricas incluem taxa de casos aprovados, recall de factos, recall de restrições e falsos positivos nos dois casos sem evidência. Um corpus de 11 perguntas é um conjunto de regressão pequeno, não uma amostra estatística representativa de todas as perguntas dos visitantes.

## Agent Core, factualidade e abstenção

Foram acrescentados testes para:
- Transporte da restrição editorial sobre o papel individual não confirmado no projecto, com validação de uma saída de abstenção estruturada. O teste usa um stub de contrato, não o modelo real.
- Não enviar ao modelo um pedido de dados pessoais sem suporte na Knowledge Base.
- Rejeitar acções não incluídas na whitelist.
- Rejeitar parâmetros arbitrários, propriedades extra e valores do tipo URL/script.

A validação de IDs de citação prova que a referência pertence ao conjunto recuperado. Não prova entailment semântico frase a frase. A qualidade das saídas reais do Qwen3 continua sem avaliação até existir execução física e revisão humana de um conjunto de respostas.

## Segurança e privacidade no browser

Foi acrescentado um teste Playwright com payload HTML hostil:
- A pergunta é renderizada como texto, não como elemento HTML.
- O handler de evento não executa.
- A conversa não faz pedidos para origens externas.
- A pergunta não é enviada para uma API de inferência remota.

Este teste é uma verificação automatizada do percurso testado. Não equivale a auditoria de segurança formal, fuzzing completo, auditoria de dependências ou prova de ausência de todos os canais de rede em todos os browsers.

Foi corrigido um risco de relevância no fallback: uma pergunta sobre dados privados que apenas mencionasse «Kutuzov» podia recuperar o perfil por coincidência lexical. O fallback exclui o nome próprio da correspondência de relevância e permite a pesquisa por nome apenas em perguntas directas de identidade, limitadas a registos públicos de identidade. O histórico mantém IndexedDB local e opt-in, sem cifragem própria da aplicação.

## Browsers

A CI usa quatro configurações Playwright:
- Chromium.
- Google Chrome Stable.
- Microsoft Edge Stable.
- WebKit.

WebKit em Linux não é Safari no macOS/iOS. A execução em CI não valida WebGPU, drivers, memória, temperatura nem comportamento de hardware Apple. A matriz física está em `docs/PHASE-9-DEVICE-MATRIX.md`.

## Budgets do bundle inicial

Foi adicionado `npm run check:bundle`, que mede os ficheiros efectivos de `dist/index.html`, JavaScript de entrada e CSS de entrada, incluindo gzip, e falha se os limites forem excedidos.

Budgets iniciais:
- HTML: máximo 2 KiB.
- JavaScript inicial: máximo 450 KiB bruto e 135 KiB gzip.
- CSS inicial: máximo 25 KiB bruto e 6 KiB gzip.
- HTML inicial não pode referenciar directamente os chunks WebLLM ou o Worker.

Os artefactos de inferência são reportados separadamente e não fazem parte do budget inicial. Os pesos não são incluídos no Git nem neste budget. O script mede o build, não download real, CPU, memória ou performance de inferência.

## Comparação de modelos

A comparação de SmolLM2 360M, Qwen3 0.6B e Llama 3.2 1B está documentada em `docs/MODEL-EVALUATION.md`.

Decisão provisória:
- Manter Qwen3-0.6B q4f16_1 MLC como candidato actual devido ao tamanho moderado, licença Apache-2.0 e declaração multilingue.
- Não afirmar que é o melhor em português: a qualidade real ainda não foi medida.
- SmolLM2 360M é menor, mas a orientação pública da família é sobretudo inglês.
- Llama 3.2 1B tem português na lista de línguas suportadas, mas é maior e usa Meta Llama Community License.

A comparação utiliza metadados de repositórios e configurações publicadas. Nenhum dos modelos alternativos foi descarregado ou executado nesta fase. Não há resultados comparativos de tokens/s, latência ou factualidade em hardware real.

## Resultados da CI e desempenho medido

Workflow: [JARVIS quality gates, run 41561565406](https://github.com/edmundokutuzov333/kutuzov-jarvis/actions/runs/41561565406), conclusão success.

- TypeScript: aprovado.
- ESLint: aprovado.
- Vitest: 17 ficheiros, 110/110 testes aprovados.
- Build de produção: aprovado.
- Budget do bundle inicial: aprovado.
- Playwright: 44/44 testes aprovados, com 11 testes em cada projecto: Chromium, Chrome Stable, Microsoft Edge Stable e WebKit.

Tamanhos medidos:
- HTML inicial: 697 bytes, budget 2,048.
- JavaScript inicial: 405,310 bytes, 120,200 bytes gzip; budget 460,800 bytes / 138,240 gzip.
- CSS inicial: 22,282 bytes, 5,253 bytes gzip; budget 25,600 bytes / 6,144 gzip.
- Chunk runtime WebLLM: 5,954.23 KB, gzip 2,148.18 KB.
- Worker WebLLM: 6,121.59 KB.

O runtime e o Worker são artefactos separados. O HTML de entrada não os referencia. Os testes E2E confirmam que abrir a interface não descarrega o runtime nem os pesos. O peso do modelo não faz parte destes tamanhos.

O corpus de retrieval obteve 11/11 casos aprovados, 9/9 factos públicos esperados recuperados, 1/1 restrição editorial recuperada e 0/2 falsos positivos nos casos sem evidência.

Os testes de acções, validação de propostas, memória, fallback, XSS e ausência de pedidos externos no percurso determinístico passaram nos quatro projectos Playwright.

## Critérios de aceitação e bloqueios

| Critério | Estado |
|---|---|
| Suite TypeScript, lint, Vitest e build | Aprovada na CI |
| Corpus determinístico de retrieval PT | 11/11 casos aprovados |
| Factos públicos esperados | 9/9 recuperados |
| Restrições editoriais esperadas | 1/1 recuperada |
| Falsos positivos em casos sem evidência | 0/2 |
| Segurança XSS de renderização | Aprovada em 4 projectos Playwright |
| Ausência de chamadas externas no percurso determinístico | Aprovada em 4 projectos Playwright |
| Acções inválidas e parâmetros arbitrários | Aprovados nos testes unitários |
| Chromium, Chrome Stable, Edge Stable e WebKit | 44/44 testes aprovados |
| Budgets do bundle inicial | Aprovados |
| Respostas reais do Qwen3 e entailment | Pendente de GPU física e revisão humana |
| Tamanho real transferido dos pesos | Pendente de medição no browser |
| Inicialização, primeiro token e tokens/s | Pendente de GPU física |
| Pico de memória GPU/RAM | Pendente de dispositivo físico |
| Safari real em macOS/iOS | Pendente |
| Windows, Android e dispositivos sem WebGPU | Pendente de ensaio físico |

## Limitações conhecidas

- Não há uma execução real do Qwen3 em GPU registada neste repositório.
- Não foram medidos download frio/quente, tempo de inicialização, primeiro token, tokens/s nem pico de memória.
- O valor de 1,403.34 MB da configuração Qwen3 é um requisito configurado pelo registo MLC/WebLLM, não medição de VRAM.
- Os tamanhos dos repositórios HF não são equivalentes aos bytes efectivamente transferidos pelo browser.
- A bateria de retrieval cobre 11 perguntas fixas e não prova cobertura semântica de todas as perguntas.
- Citações estruturalmente válidas podem não sustentar semanticamente cada afirmação.
- Playwright WebKit em Linux não substitui Safari em dispositivo Apple.
- A integração no portefólio oficial continua fora do âmbito desta fase.

## Próxima decisão

A Fase 9 só poderá ser aceite integralmente depois de:
1. A CI completa passar nos quatro projectos Playwright e no budget.
2. Pelo menos um dispositivo físico com WebGPU carregar e executar Qwen3.
3. Ser testado fallback num browser/dispositivo sem suporte ou com recursos insuficientes.
4. Ser executado o protocolo de qualidade em português, abstenção e factualidade.
5. Ser registado download real, inicialização, primeiro token, tokens/s e memória disponível.

A Fase 10 não deve começar enquanto estes bloqueios estiverem abertos.
