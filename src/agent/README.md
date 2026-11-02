# Agent Core

A Fase 5 introduz a orquestração entre o visitante, o Knowledge Engine e o modelo local.

## API

- `runAgentTurn(question, options)`: valida entrada, recupera factos, prepara contexto, gera e valida a resposta.
- `createLocalAgentModel(runtime)`: adapta o LocalInferenceRuntime à interface do Agent Core.
- `AGENT_SYSTEM_PROMPT`: System Prompt versionado.
- `AGENT_PROMPT_VERSION`: versão do contrato de comportamento.
- `parseAgentModelOutput(raw, knowledge)`: valida JSON, schema e allowlist de citações.

## Exemplo de integração futura

```ts
const model = createLocalAgentModel(runtime);

const result = await runAgentTurn(question, {
  model,
  history: recentMessages,
  signal: abortController.signal,
});
```

O runtime tem de estar carregado antes de uma pergunta com evidência ser enviada ao modelo. Se não houver evidência pública, o Agent Core devolve uma abstenção determinística sem invocar o modelo.

## Contrato de resposta

A saída do modelo contém `status`, `answer`, `citationIds` e `followUpQuestion`. Apenas IDs presentes nas referências públicas recuperadas são aceites. O chamador recebe referências resolvidas com label, origem e data do snapshot.

## Limites

- O histórico é temporário, não persistido.
- A interface conversacional pertence à Fase 8.
- Acções estão bloqueadas até à Fase 6.
- A validação JSON é feita com prompt e Zod após geração, não por constrained decoding.
- A validação de pertença da citação não é uma prova semântica de que a fonte sustenta cada frase.
- O modelo real continua pendente de teste físico WebGPU.
