# Avaliação e comparação de modelos compactos

**Data de pesquisa:** 3 de Novembro de 2026  
**Âmbito:** metadados públicos de modelos e configurações MLC/WebLLM. Esta comparação não é um benchmark de inferência efectuado pelo JARVIS.

## Critérios

1. Adequação documentada a português/multilinguismo.
2. Tamanho publicado do repositório de pesos quantizados.
3. Requisito de memória configurado no registo WebLLM, quando disponível.
4. Compatibilidade com WebLLM/WebGPU.
5. Licença do modelo upstream e origem dos ficheiros.
6. Qualidade real de respostas, que só pode ser medida num ensaio físico controlado.

## Comparação

| Candidato | Variante MLC / quantização | Tamanho indicado dos artefactos | VRAM configurada WebLLM | Português | Licença upstream | Estado |
|---|---|---:|---:|---|---|---|
| SmolLM2 360M Instruct | q4f16_1 MLC | Cerca de 207 MB no repositório HF | 376.06 MB no registo prebuilt consultado; requer shader-f16 | O model card da família descreve foco sobretudo em inglês; não é a melhor escolha para uma experiência PT-first | Apache-2.0 | Compatível tecnicamente; rejeitado como candidato principal por risco de qualidade em português |
| Qwen3 0.6B | q4f16_1 MLC | Cerca de 352 MB listados no repositório HF | 1,403.34 MB no registo fixado do projecto | O model card declara suporte a mais de 100 línguas e dialectos; qualidade específica em português ainda não medida | Apache-2.0 | Candidato actual; inferência física e qualidade ainda não aprovadas |
| Llama 3.2 1B Instruct | q4f16_1 MLC | Cerca de 705 MB no repositório HF | 879.04 MB no registo prebuilt consultado | A documentação oficial da família inclui português entre as línguas suportadas | Meta Llama 3.2 Community License | Alternativa de comparação; maior footprint e licença específica a rever |

Os tamanhos são valores publicados/listados nos repositórios ou páginas dos modelos, não uma medição do download no browser desta aplicação. O campo `vram_required_MB` é configuração/requisito do registo WebLLM, não memória GPU efectivamente observada. As variantes quantizadas podem depender de bibliotecas WASM/MLC separadas.

## Decisão provisória

Manter Qwen3-0.6B q4f16_1 MLC como candidato actual por combinar tamanho moderado, licença Apache-2.0 e declaração multilingue. Não o declarar o melhor modelo para português: não existe ainda execução física, teste comparativo ou corpus de saída do modelo.

SmolLM2 360M é mais pequeno, mas a orientação pública para inglês torna arriscado seleccioná-lo para o requisito principal de português. Llama 3.2 1B é um candidato de comparação caso Qwen3 falhe os testes em português, mas exige rever a Community License da Meta e só justifica o maior tamanho se a melhoria for demonstrada.

Nenhum modelo alternativo foi instalado, os pesos não foram descarregados e nenhuma API remota foi usada.

## Protocolo obrigatório para comparar outputs reais

Executar os mesmos casos, com a mesma versão do Agent Core, temperatura, top-p, limite de tokens e contexto:
- Perguntas factuais em português europeu e moçambicano com resposta curta e precisa.
- Seguimentos dependentes do histórico.
- Perguntas parciais com resposta parcial e limites explícitos.
- Perguntas sem evidência, incluindo prémios, datas, cargos e resultados não publicados.
- Perguntas sobre o papel individual nos quatro projectos publicados.
- Prompt injection no texto da pergunta e nos documentos.
- Acções válidas e inválidas, com confirmação separada.
- JSON válido, inválido, citações extra e campos extra.

Métricas por modelo:
- Exact match das citações esperadas e recall de factos.
- Claim support/entailment verificado por revisão humana contra a fonte, não apenas presença de uma citação válida.
- Taxa de abstenção correcta e taxa de resposta não suportada.
- Conformidade do JSON e taxa de propostas de acção inválidas.
- Qualidade linguística em português europeu/moçambicano, avaliada por revisão humana.
- Tempo de inicialização, primeiro token, tokens/s, download real e pico de memória.

Não preencher estes resultados com dados simulados ou com um mock do AgentModelPort.

## Fontes consultadas

- WebLLM, registos prebuilt e requisitos WebGPU: https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
- MLC SmolLM2 360M Instruct: https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q4f16_1-MLC
- Model card SmolLM2: https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct
- MLC Qwen3-0.6B: https://huggingface.co/mlc-ai/Qwen3-0.6B-q4f16_1-MLC
- Model card Qwen3: https://huggingface.co/Qwen/Qwen3-0.6B
- MLC Llama 3.2 1B Instruct: https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC
- Meta Llama 3.2 documentation and license: https://www.llama.com/docs/model-cards-and-prompt-formats/llama3_2/
