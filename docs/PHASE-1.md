# Fase 1: investigação e auditoria

**Data da auditoria:** 2 de Novembro de 2026  
**Estado:** Concluída com ressalva técnica documentada  
**Branch:** main  
**Repositório:** edmundokutuzov333/kutuzov-jarvis

## Objectivo

Auditar o OpenJarvis, inspeccionar o portefólio oficial em modo de leitura, confirmar a fonte de dados pública, investigar WebLLM/WebGPU e comparar modelos compactos e respectivas licenças.

A Fase 1 não implementa a aplicação. Produz evidência, delimita os riscos e prepara decisões para a Fase 2.

## Resultado executivo

1. **OpenJarvis:** é uma framework abrangente de agentes e infraestrutura de IA, com runtime principal em Python. Devemos aproveitar conceitos, não importar a framework.
2. **Portefólio:** a fonte de verdade pública é o CMS Supabase. No momento da auditoria estavam publicados 4 projectos e visíveis 20 clientes. Os dados estáticos em src/lib/content.ts não devem ser tratados automaticamente como fonte de verdade.
3. **WebLLM:** permite executar inferência directamente no browser através de WebGPU, sem servidor de inferência. Exige HTTPS e equipamento/browser compatível.
4. **Modelo candidato:** Qwen3-0.6B em q4f16_1 é o primeiro candidato a validar, por ser pequeno, multilingue e Apache 2.0. Existe um artefacto comunitário compilado para WebLLM, mas a sua cadeia de compilação e distribuição tem de ser validada antes de adopção.
5. **Baseline alternativo:** Llama 3.2 1B Instruct q4f16_1 está na configuração prebuilt do WebLLM e declara suporte oficial de português, mas é maior, tem requisitos de memória superiores e utiliza a licença comunitária da Meta.
6. **Acções:** não depender de function calling nativo dos modelos pequenos. A aplicação deverá usar um router determinístico de intenções, schemas Zod e uma lista fechada de acções.

## 1. Auditoria do OpenJarvis

Resultado completo em [OPENJARVIS-AUDIT.md](OPENJARVIS-AUDIT.md).

Conclusões principais:
- OpenJarvis tem arquitectura de agentes, engines, memory, retrieval, ferramentas, guardrails, telemetria, traces, scheduler, canais, servidor e speech.
- A implementação principal é Python e a distribuição inclui dependências e extras que não fazem sentido no JARVIS browser-first.
- O padrão SimpleAgent é relevante: uma pergunta, contexto limitado, uma geração e uma resposta.
- Retrieval com atribuição de fontes é relevante.
- Tool registry, schemas e políticas de capacidades são referências conceptuais.
- Orquestração multiagente, execução de código, servidor FastAPI, scheduler, learning e storage vectorial não são necessários.
- Não foi copiado código do OpenJarvis.

## 2. Auditoria do portefólio

Resultado completo em [PORTFOLIO-DATA-AUDIT.md](PORTFOLIO-DATA-AUDIT.md).

O portefólio foi inspeccionado no commit 16c535a7fd368d2aee11dd80728d42e6eb0ebe67, na branch main, sem alterações.

A base Supabase correspondente foi inspeccionada apenas com consultas SELECT. Nenhum registo foi escrito, actualizado ou eliminado.

Contagens publicadas observadas:
- 8 páginas.
- 1 perfil.
- 4 projectos.
- 20 clientes visíveis.
- 5 experiências.
- 5 competências.
- 5 métricas.
- 3 grupos de disciplinas.
- 4 princípios.
- 5 serviços.
- 4 etapas do processo.

Limitações importantes:
- A biografia no campo profile_content.biography está vazia.
- O conteúdo da página About tem fallback para uma biografia estática em src/lib/content.ts.
- Existe uma secção rich_text publicada na tabela page_sections. A divergência entre a secção publicada e o fallback do componente About deve ser reconciliada antes da Knowledge Base final.
- A tabela projects não tem campo role. A página de detalhe apresenta actualmente Art Direction como texto fixo, logo não é prova de que esse tenha sido o papel de Kutuzov em cada projecto.
- Os projectos publicados têm summary nulo. Os campos challenge, idea e outcome estão preenchidos.
- As métricas publicadas são conteúdo do portefólio, não validação independente de resultados.

A futura Knowledge Base deverá consumir apenas conteúdo publicado e verificado. Não deve importar automaticamente todos os arrays estáticos de content.ts.

## 3. WebLLM e WebGPU

Resultado completo em [MODEL-RESEARCH.md](MODEL-RESEARCH.md).

Conclusões:
- WebLLM executa o modelo no browser e usa WebGPU; não precisa de um servidor de inferência.
- O motor deve ser carregado sob pedido e isolado num Worker.
- A configuração prebuilt do WebLLM é a fonte de verdade dos modelos já compilados para a versão corrente.
- Qwen3-0.6B não aparece na lista prebuilt inspeccionada. Existe um artefacto comunitário compilado para WebLLM, pelo que a utilização depende da validação desse artefacto ou da compilação de uma biblioteca própria.
- Llama 3.2 1B q4f16_1 está na lista prebuilt.
- O function calling nativo está marcado como WIP e a lista actual de modelos elegíveis contém modelos Hermes de 7B/8B, demasiado grandes para a prioridade de leveza.
- WebLLM permite JSON/structured output, mas a saída do modelo continua a ser não confiável e deve ser validada.
- WebGPU tem disponibilidade limitada e requer contexto seguro HTTPS.
- Cache API, IndexedDB e OPFS são opções de cache. A persistência do browser é best-effort por defeito e pode ser removida pelo browser ou pelo utilizador.

## 4. Decisão de modelo

**Primeiro candidato de prova:** Qwen3-0.6B q4f16_1.  
**Baseline de comparação:** Llama 3.2 1B Instruct q4f16_1.  
**Não seleccionado como modelo principal:** SmolLM2-360M Instruct, por ser primariamente orientado para inglês.

A selecção é provisória. Ainda não existe benchmark executado dentro da aplicação em browsers e equipamentos reais. Não aprovar o modelo de produção antes de medir português, factualidade, estrutura de respostas, memória, tempo de carregamento e velocidade de geração.

## 5. Arquitectura recomendada após a auditoria

- Interface React/TypeScript independente.
- WebLLM carregado dinamicamente e executado em Worker.
- Modelo compacto quantizado, escolhido após prova técnica.
- Knowledge Base pequena, exportada de conteúdo público verificado.
- Pesquisa lexical e por metadados como primeiro mecanismo.
- Contexto limitado e referências de origem.
- Action Router determinístico e registry fechado.
- Zod para validar comandos e parâmetros.
- IndexedDB para histórico local, caso os testes confirmem a necessidade.
- Cache de pesos gerida pelo WebLLM e pelo browser, com opção de voltar a descarregar.
- Fallback determinístico quando WebGPU ou o modelo não estiverem disponíveis.
- Sem APIs remotas de inferência, sem servidor de IA e sem escrita no CMS.

## 6. Riscos e questões abertas

1. Qwen3-0.6B: o artefacto WebGPU encontrado é comunitário. Antes de o distribuir, validar proveniência, hashes, licença do conversor, toolchain e comportamento no browser. Alternativamente, reproduzir a compilação e alojar artefactos controlados.
2. Compatibilidade: não existe compatibilidade WebGPU universal. É obrigatório detectar capacidades e testar browsers/equipamentos.
3. Peso inicial: os pesos do modelo são descarregados do exterior, mesmo que a inferência seja local. O primeiro carregamento tem custo de tráfego e armazenamento.
4. Cache: não prometer que o modelo ficará guardado para sempre; os browsers podem eliminar dados best-effort.
5. Qualidade em português: os cartões dos modelos não garantem qualidade em português moçambicano. É necessário um conjunto de avaliação próprio.
6. Factualidade: a base actual tem somente quatro projectos publicados e não contém papel desempenhado por projecto. O JARVIS deve assumir essa limitação.
7. CMS: o site depende actualmente de Supabase para conteúdo dinâmico. A versão independente deve usar um snapshot público compacto; a integração futura pode consumir o CMS em modo read-only.
8. Conteúdo estático: claims de content.ts e campos de perfil devem ser reconciliados com o CMS antes de entrarem na base final.

## 7. Critérios de saída da Fase 1

- [x] Auditoria do OpenJarvis.
- [x] Auditoria do código do portefólio em modo de leitura.
- [x] Auditoria read-only do conteúdo público do CMS.
- [x] Identificação de dados publicados, fallbacks e discrepâncias.
- [x] Investigação da documentação e configuração actual do WebLLM.
- [x] Comparação de modelos e licenças.
- [x] Arquitectura recomendada documentada.
- [x] Riscos e questões abertas registados.
- [x] README actualizado no final da fase.
- [x] Nenhuma alteração ao portefólio oficial.
- [x] Nenhuma dependência instalada e nenhum modelo descarregado.

**Ressalva:** a fase de investigação está concluída. A aprovação final do modelo fica condicionada à prova técnica e aos benchmarks da implementação, porque ainda não existe uma aplicação nem um ambiente de browser controlado neste repositório.

## Próximo passo

**Fase 2: fundação técnica.** Criar a aplicação React/TypeScript/Vite, configurar testes, lint e build, definir contratos de tipos e preparar a estrutura modular sem carregar ainda o modelo na experiência inicial.
