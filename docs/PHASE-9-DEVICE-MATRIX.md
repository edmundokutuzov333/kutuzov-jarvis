# Fase 9: matriz de validação em dispositivos reais

**Estado:** pendente de preenchimento com hardware físico. Esta matriz é um registo de ensaio, não uma declaração de compatibilidade.

## Regras de registo

Para cada execução com WebGPU, registar:
- Data/hora UTC.
- Browser e versão exacta, sistema operativo e versão.
- CPU, GPU e memória física do equipamento.
- Secure Context e resultado de navigator.gpu.requestAdapter().
- Vendor, architecture, shader-f16 e limites do adaptador comunicados pelo browser.
- Cache fria ou quente.
- Bytes efectivamente transferidos para configuração, tokenizer, shards de pesos e biblioteca WASM, medidos pela rede do browser, sem confundir o tamanho do repositório com o download real.
- Tempo de transferência, tempo de inicialização, tempo até ao primeiro token e tokens por segundo.
- Pico de memória do processo/browser, quando o sistema operativo disponibilizar uma medição fiável.
- Resultado de perguntas de referência, erros, cancelamento, unload e comportamento de fallback.

Não inferir VRAM a partir de vram_required_MB da configuração WebLLM. Esse campo é requisito estimado/configurado, não medição do dispositivo.

## Estado dos ensaios físicos

| Plataforma | Browser/versão | GPU | WebGPU | Download real | Init | Primeiro token | Tokens/s | Resultado |
|---|---|---|---|---:|---:|---:|---:|---|
| Mac M3 / macOS | Não executado | Apple GPU | Pendente | Pendente | Pendente | Pendente | Pendente | Bloqueado por falta de execução física |
| Windows / NVIDIA | Não executado | Não especificada | Pendente | Pendente | Pendente | Pendente | Pendente | Não testado |
| Windows / Intel ou AMD | Não executado | Não especificada | Pendente | Pendente | Pendente | Pendente | Pendente | Não testado |
| Android / Chrome | Não executado | Não especificada | Pendente | Pendente | Pendente | Pendente | Pendente | Não testado |
| iOS / Safari | Não executado | Apple GPU | Pendente | Pendente | Pendente | Pendente | Pendente | Não testado |

## Browsers cobertos por CI

A CI executa Playwright em:
- Chromium.
- Google Chrome Stable.
- Microsoft Edge Stable.
- WebKit.

Playwright WebKit em Linux não é equivalente a Safari no macOS/iOS. Os testes não validam as políticas de GPU, drivers, memória unificada, comportamento térmico ou limitações específicas de dispositivos Apple. A matriz acima só poderá ser preenchida com testes em equipamentos físicos.

## Critério de desbloqueio

A aceitação integrada de WebLLM requer pelo menos um teste positivo num dispositivo físico com GPU e WebGPU, mais um teste de fallback num equipamento/browser sem suporte ou com recursos insuficientes. Deve ser anexado um registo com versões e medições reais. Enquanto não existir esse registo, a compatibilidade física e a performance de inferência permanecem pendentes.
