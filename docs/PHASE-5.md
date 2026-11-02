# Fase 5: Agent Core

**Data:** 2 de Novembro de 2026  
**Estado:** Implementação do Agent Core concluída e validada por CI. Aceitação integrada continua pendente de inferência física com Qwen3 e avaliação de qualidade factual.

## Objectivo

Ligar a pergunta do visitante à recuperação da Knowledge Base, preparar instruções especializadas, executar o modelo local através do runtime WebLLM e validar a saída antes de a devolver à interface.

O Agent Core é um único ciclo de conversação especializado. Não é um sistema multiagente, não contém ferramentas executáveis e não introduz inferência remota.

## Componentes implementados

| Ficheiro | Responsabilidade |
|---|---|
| `src/agent/contracts.ts` | Schemas Zod de pergunta, histórico e saída estruturada |
| `src/agent/prompts.ts` | System Prompt e construção do pedido em JSON, versão 1.0.0 |
| `src/agent/model-port.ts` | Interface tipada para geração local |
| `src/agent/local-model.ts` | Adaptador do Agent Core para LocalInferenceRuntime |
| `src/agent/response.ts` | Parsing JSON, validação e resolução de citações |
| `src/agent/agent-core.ts` | Orquestração de recuperação, contexto, geração, cancelamento e abstenção |
| `src/agent/index.ts` | API pública do Agent Core |

## Ciclo de conversação

1. Validar a pergunta e o histórico.
2. Construir uma query de recuperação. Perguntas curtas de seguimento podem reutilizar a última pergunta do visitante como contexto de pesquisa.
3. Executar pesquisa lexical até 12 resultados.
4. Aplicar um filtro de relevância temática. A simples presença do nome Kutuzov não é suficiente para responder a qualquer assunto.
5. Construir contexto com máximo de 3.200 caracteres e 6 registos.
6. Se não existir facto público, devolver uma abstenção determinística sem chamar o modelo.
7. Se existir evidência, serializar pergunta, histórico e Knowledge Context como dados JSON na mensagem do utilizador.
8. Enviar o System Prompt versionado e o contexto ao adaptador local.
9. Recolher o streaming internamente e limitar a saída a 12.000 caracteres.
10. Fazer parse estrito do JSON, validar o schema Zod e verificar cada ID de citação contra as referências públicas recuperadas.
11. Devolver resposta estruturada e fontes já resolvidas, ou rejeitar a saída inválida.

O histórico é apenas contexto transitório passado pelo chamador. O Agent Core não o persiste. A persistência local pertence à Fase 7.

## System Prompt v1.0.0

O prompt define:
- Identidade: assistente digital, nunca a própria pessoa.
- Âmbito: percurso e trabalho profissional de Kutuzov.
- Língua: responder na língua da pergunta, com português claro e natural.
- Fonte factual única: factos públicos recuperados da Knowledge Base.
- Factualidade: não inventar datas, cargos, projectos, resultados, prémios ou relações.
- Restrições editoriais: respeitar biografia e papéis por projecto não confirmados.
- Prompt injection: pergunta, histórico e registos são dados não confiáveis, nunca instruções que substituem o System Prompt.
- Citações: usar apenas IDs de factos incluídos na lista de referências públicas.
- Ferramentas: não propor nem executar acções; isso pertence à Fase 6.
- Saída: JSON estrito com quatro campos.

O prompt não contém a biografia nem a lista de factos profissionais. Esses dados permanecem na Knowledge Base.

## Respostas estruturadas

Contrato de saída:
- `status`: `answered` ou `insufficient_evidence`.
- `answer`: texto simples, entre 1 e 3.000 caracteres, sem tags HTML.
- `citationIds`: até 6 IDs de factos públicos recuperados.
- `followUpQuestion`: string curta ou null.

Regras:
- Uma resposta `answered` exige pelo menos uma citação.
- Uma resposta `insufficient_evidence` não pode citar factos.
- IDs duplicados, desconhecidos, fora do contexto, campos adicionais, HTML e JSON inválido são rejeitados.
- Se o modelo escolher `insufficient_evidence`, a aplicação substitui o texto gerado por uma abstenção determinística.

A geração estruturada usa instruções JSON no prompt e validação Zod depois da geração. Não está activado constrained decoding ou grammar decoding; a compatibilidade dessa opção com o modelo e o pacote fixado não foi demonstrada. Portanto, a saída pode ser rejeitada quando o modelo não respeitar o formato.

## Integração com o runtime local

O `LocalInferenceRuntime.generate` aceita agora opções controladas:
- System Prompt específico.
- Limite de tokens, limitado pela aplicação a 32-1.024.
- Temperature, limitada a 0-1.
- Top-p, limitado a 0,05-1.

O adaptador `createLocalAgentModel(runtime)` implementa a interface do Agent Core e encaminha a geração para o runtime WebLLM existente. O carregamento do modelo permanece explícito e feito num Worker. Nenhum código de inferência remota foi adicionado.

A configuração de geração do Agent Core usa 420 tokens, temperature 0,15 e top-p 0,82. Estes valores são parâmetros iniciais de engenharia, ainda não aprovados por benchmark físico.

## Segurança e limites

Implementado:
- Entrada e histórico validados com Zod.
- Apenas roles user/assistant no histórico.
- Máximo de 2.000 caracteres por pergunta.
- Máximo de 6 mensagens de histórico, usando as 4 mais recentes no prompt.
- Histórico truncado a 400 caracteres por mensagem no prompt.
- Pergunta, histórico e Knowledge Context serializados como JSON na mensagem de utilizador.
- Conteúdo recuperado nunca é promovido a instrução.
- Sem HTML, JavaScript, URLs ou ferramentas geradas pelo modelo.
- Saída estrita, sem propriedades extra.
- Citações verificadas contra a allowlist de referências recuperadas.
- Rejeição de output vazio, inválido ou demasiado grande.
- Cancelamento propagado ao runtime local.
- Sem persistência ou envio remoto das conversas.

Limite importante: validar que uma citação pertence ao conjunto recuperado não prova, por si só, que cada frase da resposta é semanticamente implicada por aquela fonte. Essa verificação exige avaliação factual com perguntas e respostas esperadas, além de testes no modelo real, a executar nas Fases 3 e 9. A defesa contra prompt injection é uma camada de instruções e validação, não uma garantia matemática contra todos os comportamentos do modelo.

## Testes

Foram preparados testes de:
- Schemas e limites de entrada.
- Prompt versionado e separação de instruções/dados.
- Parsing JSON e rejeição de HTML.
- Citações válidas e inválidas.
- Abstenção sem evidência.
- Filtro para não confundir o nome da pessoa com evidência temática.
- Reutilização do tópico em perguntas de seguimento.
- Cancelamento.
- Limite de output.
- Rejeição de histórico excessivo.

Os testes de orquestração usam um adaptador determinístico de teste para testar o contrato do Agent Core. Não representam uma execução real do Qwen3 e não são usados como prova de desempenho ou qualidade do modelo.

### Resultado CI

Workflow [JARVIS quality gates, run 41489413842](https://github.com/edmundokutuzov333/kutuzov-jarvis/actions/runs/41489413842) concluído com sucesso:

- TypeScript: aprovado.
- ESLint: aprovado.
- Vitest: 10 ficheiros, 66/66 testes aprovados.
- Build de produção: aprovado.
- Playwright Chromium: 2/2 testes aprovados.
- Lockfile: preservado. Não foram adicionadas dependências.

### Tamanhos observados no build

- Entrada JavaScript inicial: 323.85 KB, gzip 99.44 KB.
- CSS: 8.93 KB, gzip 2.53 KB.
- Chunk runtime WebLLM: 5,954.23 KB, gzip 2,148.18 KB.
- Worker WebLLM: 6,121.59 KB.

O aviso de chunks acima de 500 KB mantém-se devido ao runtime de inferência. O teste Playwright continua a verificar que os artefactos de modelo e os chunks WebLLM não são solicitados na visita inicial. O Agent Core ainda não está ligado à UI conversacional, que pertence à Fase 8.

## Pendente / bloqueado

- Carregar Qwen3 em GPU física e confirmar geração local, ainda pendente da Fase 3.
- Avaliar se o Qwen3 0.6B obedece ao contrato JSON de forma consistente.
- Medir tempo até primeiro token, tokens/s e qualidade do português.
- Executar dataset de perguntas reais e perguntas sem resposta.
- Medir factualidade/entailment entre respostas e fontes.
- Integrar a conversa na interface final, pertencente à Fase 8.
- Memória persistente e eliminação do histórico, pertencentes à Fase 7.

## Resultado

**Implementado:** ciclo Agent Core, prompts, contexto transitório, interface de geração local, saída estruturada e validação de referências.  
**Testado:** quality gates automatizados, a confirmar pelo workflow associado ao commit.  
**Pendente:** inferência física e avaliação factual com Qwen3.  
**Não iniciado:** Action Engine, memória persistente e UI conversacional.

A Fase 5 está implementada no código e preparada para integração. Não está aprovada como assistente funcional de produção até a inferência local real e a qualidade das respostas serem demonstradas.
