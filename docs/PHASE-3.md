# Fase 3: Local Intelligence Engine

**Data:** 2 de Novembro de 2026  
**Estado:** Implementação e validação automatizada concluídas. Aceitação final pendente de teste do modelo em equipamento físico com WebGPU.

## Objectivo

Integrar WebLLM e preparar a inferência local no browser, sem API de IA remota, servidor dedicado ou computador de Kutuzov como runtime.

## Modelo integrado

- Modelo: Qwen3-0.6B q4f16_1 MLC.
- Model ID: `Qwen3-0.6B-q4f16_1-MLC`.
- WebLLM: 0.2.87.
- Revisão dos pesos: `8c14ce481d4c692769976ad52afea453a102df19`.
- Biblioteca WebGPU: `v0_2_87/base`.
- Commit dos binários MLC: `146ed9cd4b4062e967b017fd2291f7106b50599f`.
- Git blob da biblioteca WASM: `bccc95f5fa0cac4a5bfa7a6305c6195eea23f7f7`.
- Contexto: 4096 tokens.
- VRAM estimada na configuração prebuilt WebLLM: 1403.34 MB.
- Tamanho listado dos ficheiros do modelo: cerca de 352 MB. A transferência real não foi medida nesta aplicação.

As origens Hugging Face MLC e GitHub MLC servem ficheiros estáticos. Não recebem perguntas nem executam inferência.

## Implementado

- [x] WebLLM 0.2.87 adicionado como dependência fixada.
- [x] Registo do modelo Qwen3 oficial MLC.
- [x] Revisões dos pesos e da biblioteca WebGPU fixadas.
- [x] SRI da configuração e tokenizer, com falha fechada.
- [x] Verificação de contexto seguro e detecção WebGPU.
- [x] Obtenção de adaptador, limites e funcionalidades expostas pelo browser.
- [x] Carregamento apenas depois de o visitante escolher `Load local model`.
- [x] Importação dinâmica de WebLLM.
- [x] Inicialização em Web Worker.
- [x] Progresso de carregamento.
- [x] Streaming de texto.
- [x] Cancelamento de carregamento e geração.
- [x] Consulta/limpeza da cache e unload do motor.
- [x] Tratamento de erros de WebGPU, Worker, rede, carregamento e geração.
- [x] Testes de domínio e browser para detecção e carregamento sob pedido.

## Validação CI

Workflow: [JARVIS quality gates, run 41469175743](https://github.com/edmundokutuzov333/kutuzov-jarvis/actions/runs/41469175743)

- npm lock sync e npm ci: aprovado.
- TypeScript: aprovado.
- ESLint: aprovado.
- Vitest: 3 ficheiros, 18 testes aprovados.
- Build de produção: aprovado.
- Playwright Chromium: 2 testes aprovados.
- Lockfile: sincronizado e versionado.

### Tamanhos observados no build

- Entrada JavaScript inicial: 323.11 KB, gzip 99.17 KB.
- CSS: 8.93 KB, gzip 2.53 KB.
- Chunk runtime: 5,954.23 KB, gzip 2,148.18 KB.
- Chunk Worker: 6,121.59 KB.

Os chunks do runtime e Worker são artefactos separados. Os testes de browser confirmam que não são solicitados na visita inicial nem ao verificar apenas a compatibilidade WebGPU. O runtime é importado por acção explícita e o Worker só é criado ao carregar o modelo.

O build assinala um chunk acima de 500 KB. O aviso fica registado para optimização posterior; não representa o tamanho da entrada inicial.

## Pendências de validação física

O CI corre em Chromium headless e não comprova execução numa GPU real. Ficam pendentes:

- [ ] Descarregar os pesos num browser real com WebGPU.
- [ ] Inicializar o modelo num dispositivo físico.
- [ ] Gerar texto localmente e confirmar streaming até ao fim.
- [ ] Medir tempo de download, tempo até modelo pronto e tempo até primeiro token.
- [ ] Medir tokens por segundo e utilização de memória GPU.
- [ ] Testar um dispositivo com memória limitada e confirmar fallback sem crash.
- [ ] Confirmar a persistência best-effort da cache após recarregar a página.

A estimativa WebLLM de 1403.34 MB é publicada na configuração, não medida neste projecto.

## Sessões retomáveis e memória

O runtime suporta cancelamento e libertação de recursos, mas ainda não retoma gerações interrompidas nem persiste sessões. A documentação WebLLM limita a geração retomável a pedidos de chat compatíveis e exige uma biblioteca com primitivas de checkpoint. A compatibilidade do binário utilizado não está demonstrada.

Não activar retomada presumida. Reavaliar após confirmar a biblioteca e desenhar a memória na Fase 7.

## Fallback determinístico

A interface detecta a ausência de WebGPU e não força o carregamento. A pesquisa determinística depende da Knowledge Base da Fase 4 e as acções de navegação dependem do Action Engine da Fase 6. A experiência completa de fallback ainda não existe.

## Resultado

O Local Intelligence Engine está implementado em código e passou o CI. A Fase 3 ainda não está aceite para produção porque falta carregar e executar o modelo num dispositivo físico com WebGPU. A validação física continua obrigatória para a aceitação da Fase 3. A implementação determinística da Fase 4 foi iniciada separadamente por autorização explícita: o Knowledge Engine não inicializa nem depende do runtime WebLLM. A aceitação integrada da Fase 4 continua pendente da prova física e de testes de respostas do modelo com contexto recuperado.

## Fontes

- WebLLM 0.2.87: https://www.npmjs.com/package/@mlc-ai/web-llm
- Configuração oficial: https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
- Qwen3 MLC: https://huggingface.co/mlc-ai/Qwen3-0.6B-q4f16_1-MLC
- Revisão dos pesos: https://huggingface.co/mlc-ai/Qwen3-0.6B-q4f16_1-MLC/tree/8c14ce481d4c692769976ad52afea453a102df19
- Binários MLC: https://github.com/mlc-ai/binary-mlc-llm-libs/commit/146ed9cd4b4062e967b017fd2291f7106b50599f
- Sessões retomáveis: https://webllm.mlc.ai/docs/user/resumable_generation.html
