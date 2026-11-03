# Gemini Integration

## Estado

Código da integração preparado para produção. A activação real depende da variável secreta `GEMINI_API_KEY` no projecto Vercel. A chave não deve ser enviada por chat, incluída em `VITE_*` ou guardada no Git.

## Arquitectura

```text
Browser
  -> GET /api/assistant (availability only)
  -> POST /api/assistant (question + bounded history)
       -> Zod input validation
       -> Agent Core
       -> Knowledge Base retrieval
       -> Gemini 3.8 Flash (server-side)
       -> strict response and citation validation
       -> Browser
```

Gemini não é treinado com os dados do utilizador. O JARVIS usa Retrieval-Augmented Generation (RAG): procura factos no catálogo público versionado e inclui o contexto relevante no pedido. O modelo não é fonte de verdade e não recebe dados privados do CMS.

## Modelo e autenticação

- Modelo predefinido: `gemini-3.8-flash`.
- Endpoint: Gemini `models.generateContent`.
- Autenticação: header `x-goog-api-key`.
- Segredo: `GEMINI_API_KEY`, exclusivamente server-side.
- Modelo configurável por `GEMINI_MODEL`, também server-side.
- JSON output mode e schema validation local pelo Agent Core.

A API oficial identifica `gemini-3.8-flash` como modelo estável e suporta saída estruturada. A chave nunca pode ser exposta no browser.

## Dados enviados à Gemini

Para cada pergunta, o servidor envia:
1. Pergunta actual do visitante.
2. Até seis mensagens recentes, cada uma limitada a 500 caracteres, para resolver continuidade.
3. Factos públicos recuperados.
4. Restrições editoriais internas, apenas para impedir afirmações não confirmadas.
5. Instruções de resposta e allowlist de acções quando existe intenção de navegação.

Não enviar morada residencial, telefone privado, credenciais, pedidos de contacto, dados de newsletter, informação administrativa ou segredos. O histórico persistente fica local ao browser e é opcional, mas o contexto recente da conversa é enviado à Gemini quando a IA está activa.

## RAG e cobertura

- Perguntas normais: retrieval lexical focado, contexto limitado e respostas curtas.
- Perguntas como "Quero saber tudo sobre mim": catálogo completo aprovado, com factos públicos e restrições editoriais.
- Biografia longa: continua pendente de confirmação editorial, porque o CMS auditado não contém uma biografia consolidada no campo publicado.
- Papel individual em cada projecto: não inferir a partir da disciplina do projecto.
- Métricas e competências: apresentadas como valores publicados, não como auditorias ou certificações independentes.

A base é um snapshot auditado em 2 de Novembro de 2026. A publicação de novos conteúdos no CMS não actualiza automaticamente este snapshot; é necessária uma nova sincronização editorial e CI.

## Navegação de projectos

Quando o visitante pedir explicitamente para abrir um projecto:
- O Agent Core reconhece intenção de navegação.
- Gemini pode propor apenas `OPEN_PROJECT`.
- Zod valida o slug contra a lista fechada de projectos publicados.
- O cliente confirma que o nome/slug do projecto aparece no pedido ou contexto recente.
- A aplicação abre apenas `https://www.edmundokutuzov.art/work/{slug}`.
- Não é aceite qualquer URL devolvido pelo modelo.
- Outras acções continuam a exigir confirmação.

## Protecções no endpoint

- Métodos permitidos: GET e POST.
- GET devolve apenas `available`, fornecedor e modelo, nunca a chave.
- POST exige same-origin quando o header Origin existe.
- Pergunta e histórico são validados por Zod.
- Corpo limitado a 8 KB; pergunta até 2.000 caracteres; histórico até seis mensagens com até 500 caracteres cada.
- Rate limit best-effort de 18 pedidos/minuto/IP em memória de cada instância Vercel. Não é um rate limiter distribuído e deve ser substituído por protecção de rede/distributed KV antes de tráfego elevado.
- Respostas e erros não incluem o conteúdo da chave.
- A função não escreve prompts, respostas ou conversas em bases de dados.

## Configuração Vercel

No projecto `kutuzov-jarvis`, adicionar:

| Name | Value | Environment | Type |
|---|---|---|---|
| `GEMINI_API_KEY` | chave criada no Google AI Studio | Production | Sensitive/Encrypted |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Production | Encrypted ou Plain, não secreto |

Depois de adicionar a chave, fazer redeploy da Production. Não partilhar a chave por chat.

A variável ainda não está configurada no momento da implementação. Sem ela, a API devolve `available: false`, e o browser mantém pesquisa local sem descarregar o Qwen3.

## Dados e custo

Usar apenas o tier pago com billing activo para informação profissional do utilizador. O tier gratuito pode usar conteúdo submetido para melhoria dos produtos Google. O tier pago declara que o conteúdo não é usado para melhoria dos produtos, mas não significa zero data retention por defeito.

Preço standard publicado para Gemini 3.8 Flash:
- até 30 de Novembro de 2026: USD 0,75 / 1M tokens de entrada e USD 3,75 / 1M tokens de saída.
- a partir de 1 de Janeiro de 2027: USD 1,50 / 1M tokens de entrada e USD 7,50 / 1M tokens de saída.

O custo real depende do volume de pedidos, do contexto recuperado e dos tokens de saída. Definir alertas/orçamentos no Google Cloud e limites de tráfego no Vercel.
