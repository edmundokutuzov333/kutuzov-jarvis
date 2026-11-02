# Pesquisa de modelos, WebLLM e WebGPU

**Data da pesquisa:** 2 de Novembro de 2026  
**Objectivo:** identificar o modelo mais pequeno que merece uma prova técnica para o Kutuzov JARVIS.

## 1. Requisitos do produto

O modelo não precisa de conhecimento geral amplo. A Knowledge Base fornecerá os factos sobre Kutuzov. O modelo deve:
- compreender perguntas em português;
- formular respostas naturais e curtas;
- seguir um System Prompt restrito;
- utilizar um contexto pequeno;
- reconhecer ausência de informação;
- gerar estruturas previsíveis quando necessário;
- funcionar em equipamentos diversos;
- justificar o descarregamento e a memória que exige.

O modelo não será a fonte de verdade. O CMS exportado e verificado será a fonte de verdade.

## 2. WebLLM: capacidades e limites actuais

WebLLM executa modelos directamente no browser através de WebGPU. A biblioteca tem exemplos de streaming, JSON mode, function calling em desenvolvimento, execução em Worker e cache.

A configuração prebuilt do repositório WebLLM é a fonte de verdade dos modelos pré-compilados suportados pela versão corrente. A pesquisa do ficheiro config.ts identificou:
- Llama 3.2 1B Instruct q4f16_1 como modelo prebuilt.
- model library version observada no config: v0_2_87/base.
- VRAM estimada para Llama 3.2 1B q4f16_1: 879.04 MB.
- context_window_size: 4096.
- low_resource_required: true.
- Qwen3-0.6B não consta da lista prebuilt inspeccionada.

### Function calling

A lista functionCallingModelIds actual contém modelos Hermes com 7B/8B parâmetros. A documentação assinala function calling como WIP.

**Decisão:** não depender de function calling nativo para modelos 0.6B ou 1B. O Action Router será determinístico. A aplicação usará um conjunto limitado de intenções e validará cada comando com Zod antes de o executar. O modelo pode sugerir uma acção, mas não executa ferramentas arbitrárias.

### WebGPU e workers

WebGPU é uma capacidade de disponibilidade limitada e requer contexto seguro HTTPS. Não pode ser tratado como universal. O browser e a GPU têm de ser detectados antes da inicialização.

A execução em Worker deve manter a interface responsiva. O runtime WebLLM deve ser lazy-loaded depois de o visitante abrir o assistente e escolher iniciar o modelo.

### Cache

WebLLM suporta Cache API, IndexedDB e OPFS, além de um backend cross-origin experimental. A configuração prebuilt actual usa Cache API por defeito.

A cache não representa armazenamento garantido para sempre. Os dados do browser são best-effort por defeito e podem ser removidos por pressão de armazenamento, políticas do browser ou acção do utilizador. O JARVIS deve verificar a cache, tratar quota e eviction, permitir limpar os ficheiros e voltar a descarregar quando necessário.

## 3. Candidatos

| Modelo | Formato | Tamanho/recursos conhecidos | Português | WebLLM | Licença | Estado |
|---|---|---|---|---|---|---|
| Qwen3-0.6B | q4f16_1 | MLC lista o artefacto em 352 MB; existe WebGPU library compilada de 5.49 MB | Cartão oficial declara 100+ línguas e dialectos; qualidade PT-MZ ainda por medir | Não está na lista prebuilt actual; existe artefacto comunitário compilado para WebLLM | Apache 2.0 para o modelo/pesos; confirmar licença e proveniência do conversor | Primeiro candidato de prova |
| Llama 3.2 1B Instruct | q4f16_1 | 705 MB de pesos no artefacto MLC; estimativa WebLLM 879.04 MB de VRAM | Português é oficialmente suportado; Meta reporta MMLU PT 39.8 no modelo e 34.9 na variante Vanilla PTQ | Prebuilt | Llama 3.2 Community License, não Apache 2.0 | Baseline comparativo |
| SmolLM2-360M-Instruct | q4f16_1 | WebLLM estima 376.06 MB de VRAM; requer shader-f16; contexto 4096 | Cartão oficial diz que os modelos compreendem e geram principalmente inglês | Prebuilt | Apache 2.0 | Não recomendado como modelo principal em português |

Os tamanhos e estimativas pertencem às fontes e artefactos indicados; não representam ainda o total de tráfego medido na aplicação JARVIS. O total real inclui pesos, tokenizer, configuração, biblioteca wasm e eventuais recursos auxiliares.

## 4. Candidato principal: Qwen3-0.6B q4f16_1

Razões:
- 0.6B parâmetros.
- O cartão oficial refere suporte a mais de 100 línguas e dialectos.
- Licença do modelo Apache 2.0.
- O artefacto MLC q4f16_1 é indicado com 352 MB.
- Existe uma compilação comunitária WebLLM com contexto de 4K, prefill chunk 1024 e wasm de 5.49 MB.
- É significativamente menor do que Llama 3.2 1B q4f16_1.

### Reserva técnica

O Qwen3-0.6B não aparece na configuração prebuilt actual do WebLLM. O artefacto browser-ready encontrado é mantido por SkillSafe AI e apresenta proveniência, upstream commit e hashes por ficheiro. O modelo card indica que os pesos permanecem sob a licença upstream do Qwen3, enquanto o conversor/recipe tem a licença própria do repositório SkillSafe.

Antes de utilizar publicamente:
1. Validar a origem do repositório SkillSafe e a licença do conversor.
2. Confirmar a cadeia de distribuição: o cartão identifica os ficheiros registry como shards de parâmetros servidos por models.skillsafe.ai depois de serem validados. Isto introduz um fornecedor externo de artefactos, embora não seja um serviço de inferência.
3. Fixar os commits exactos do modelo e do artefacto.
4. Verificar todos os hashes SHA-256 no processo de build.
5. Reproduzir a compilação e alojar os artefactos num domínio controlado, ou documentar explicitamente o risco de depender do wasm/registry comunitário.
6. Confirmar comportamento com a versão exacta do pacote WebLLM escolhida.
7. Testar respostas em português e comandos estruturados.
8. Medir tráfego total, VRAM, tempo de carregamento e geração.

Não descarregar o modelo automaticamente nem alojar os pesos no Git.

## 5. Baseline: Llama 3.2 1B Instruct q4f16_1

Razões para manter como baseline:
- Está incluído na configuração prebuilt actual do WebLLM.
- Não exige uma model library personalizada na primeira prova.
- Suporte oficial de português.
- O modelo oficial é descrito pela Meta como adequado a casos de assistant-like chat, retrieval e summarization.

Limitações:
- Os pesos são substancialmente maiores do que Qwen3-0.6B.
- A estimativa de VRAM no WebLLM é 879.04 MB.
- Utiliza a Llama 3.2 Community License, que deve ser revista antes da distribuição.
- A pontuação MMLU portuguesa oficial não é uma avaliação da qualidade conversacional do JARVIS. A própria variante quantizada reporta redução no benchmark.

## 6. SmolLM2-360M

É um modelo pequeno, Apache 2.0 e presente no catálogo prebuilt WebLLM. Contudo, o cartão oficial diz que os modelos SmolLM2 se focam sobretudo em inglês. Não será seleccionado para respostas profissionais em português sem uma avaliação que contradiga essa limitação.

## 7. Estratégia de inferência e acções

Não enviar a conversa para APIs remotas.

Fluxo previsto:
1. Validar WebGPU e as capacidades do browser.
2. O visitante escolhe carregar o modelo.
3. WebLLM é importado dinamicamente.
4. O modelo é carregado no Worker.
5. A pergunta é validada.
6. O retrieval encontra poucos factos relevantes.
7. O contexto compacto é enviado ao modelo local.
8. A resposta é apresentada progressivamente.
9. Se existir proposta de navegação, o Action Router valida a intenção e os parâmetros.
10. A aplicação executa apenas acções autorizadas.

Não depender do function calling nativo de WebLLM para o modelo pequeno. A aplicação deve usar uma allow-list de acções e validação de schemas.

## 8. Custos e dependências que continuam a existir

Zero AI API significa que as conversas não precisam de ser enviadas a um fornecedor de inferência. Não significa zero rede ou zero custo de distribuição.

O browser precisa de descarregar:
- pesos do modelo;
- tokenizer e configuração;
- biblioteca WebGPU;
- código da aplicação e dependências.

Os pesos podem ser obtidos de uma origem estática pública ou espelhados no domínio do portefólio, quando a licença e o alojamento permitirem. O GitHub repo não deve conter dezenas ou centenas de MB de pesos.

Não existe servidor de inferência. Existe, no entanto, uma origem de ficheiros de modelo. A origem deve ser fixada, versionada, validada por hash e transparente para o visitante.

## 9. Benchmarks ainda necessários

A pesquisa identificou candidatos, mas não foi executada inferência numa aplicação JARVIS porque ainda não existe aplicação implementada neste repositório.

Na prova técnica e na fase de testes medir, em browsers e equipamentos reais:
- qualidade de português europeu/moçambicano;
- exactidão da recuperação de factos;
- recusa correcta quando a informação não existe;
- qualidade de JSON e propostas de acção;
- taxa de comandos inválidos;
- tamanho total descarregado;
- tempo até modelo pronto;
- tempo até primeiro token;
- tokens por segundo;
- pico de memória de GPU;
- falhas e recuperações de WebGPU;
- comportamento de cache e re-download.

O modelo final só será aprovado depois destes testes.

## 10. Fontes oficiais e técnicas

- WebLLM: https://github.com/mlc-ai/web-llm
- WebLLM config.ts: https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
- WebLLM documentation: https://llm.mlc.ai/docs/deploy/webllm.html
- WebLLM cache example: https://github.com/mlc-ai/web-llm/tree/main/examples/cache-usage
- MDN WebGPU: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- MDN Storage quotas: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- Qwen3-0.6B model card: https://huggingface.co/Qwen/Qwen3-0.6B
- Qwen3 MLC q4f16_1: https://huggingface.co/mlc-ai/Qwen3-0.6B-q4f16_1-MLC
- Browser-ready Qwen3 artifact: https://huggingface.co/skillsafe-ai/qwen3-0.6b-q4f16
- Llama 3.2 official model card: https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/MODEL_CARD.md
- Llama 3.2 1B MLC q4f16_1 artifact (705 MB): https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC/tree/main
- SmolLM2-360M model card: https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct
