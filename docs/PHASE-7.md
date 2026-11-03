# Fase 7: Memória local e privacidade

**Data:** 3 de Novembro de 2026  
**Estado:** implementação submetida aos quality gates. A integração com a conversa final pertence à Fase 8.

## Objectivo

Guardar sessões e mensagens no dispositivo do visitante, apenas mediante autorização explícita, com limites de armazenamento, controlo de contexto e eliminação efectiva. O conhecimento profissional da Knowledge Base permanece separado e imutável.

## Implementação

### Armazenamento IndexedDB

Módulo em `src/memory/`:

- `contracts.ts`: schemas Zod para sessões, preferências e mensagens guardadas.
- `local-store.ts`: repositório IndexedDB com operações de sessões, mensagens, estado, eliminação e leitura do histórico para o Agent Core.
- `policy.ts`: limites de retenção e transformação do histórico para o contexto do modelo.
- `index.ts`: exports públicos.

A base local usa o nome `kutuzov-jarvis-conversations`, versão de schema 1 e três object stores independentes:

| Store | Conteúdo |
|---|---|
| `sessions` | ID aleatório, título genérico, datas e contador de mensagens |
| `messages` | ID, ID da sessão, papel, conteúdo e data |
| `settings` | consentimento local para guardar histórico |

Não se guardam nomes, emails, IPs, identificadores de conta ou títulos derivados do conteúdo da conversa. O título de cada sessão é sempre `Nova conversa`.

### Consentimento e controlo

- A persistência está desactivada por defeito.
- O visitante activa ou desactiva a gravação através de um controlo visível.
- Desactivar impede novas gravações, mas não apaga registos anteriores.
- O comando de eliminação fecha a ligação e chama `IDBFactory.deleteDatabase`, removendo sessões, mensagens e preferência de consentimento.
- As ligações respondem a `versionchange` e fecham para não bloquear a migração ou a eliminação.
- Se IndexedDB não existir, a aplicação não falha durante o render. O painel apresenta o erro e a memória permanece indisponível.
- Falhas de abertura, transacção, bloqueio e validação são comunicadas com códigos tipados.

### Limites de armazenamento

- Máximo de 20 sessões.
- Máximo de 100 mensagens por sessão.
- Limite máximo teórico: 2.000 mensagens.
- Retenção de 90 dias, aplicada na leitura do estado e na criação de uma sessão.
- Mensagem persistida limitada pelo schema de conversa existente: 2.000 caracteres.
- Sessões novas removem primeiro sessões expiradas e depois as mais antigas, respeitando o limite total.

### Contexto do Agent Core

`getAgentHistory(sessionId)` prepara o histórico persistido para o contrato da Fase 5:

- Apenas papéis `user` e `assistant`.
- Máximo de 6 mensagens.
- Máximo de 500 caracteres por mensagem.
- Apenas o contexto limitado é devolvido ao Agent Core.
- O histórico não se transforma em fonte de factos nem altera a Knowledge Base.

A interface conversacional ainda não existe. A leitura e a persistência estão disponíveis como serviço e serão ligadas ao ciclo conversacional na Fase 8.

## Privacidade e rede

O módulo de memória não importa clientes HTTP, não faz chamadas `fetch`, não envia eventos e não implementa sincronização. O armazenamento usa exclusivamente IndexedDB do próprio origin.

O teste Playwright observa os pedidos de rede durante operações de memória e reprova qualquer pedido para outra origem. Isto comprova o fluxo automatizado de armazenamento no Chromium, mas não é uma auditoria de rede de todos os futuros fluxos da aplicação. A ligação efectiva entre mensagens, modelo local e memória será testada novamente na Fase 8/9.

O cache de pesos WebLLM continua separado do histórico de conversação. Apagar histórico não apaga pesos do modelo, e limpar o cache do modelo não apaga o histórico.

## Interface

Foi adicionado `MemoryPrivacyPanel` à shell técnica existente. Mostra o estado de consentimento, o número de sessões/mensagens, limites de retenção e um comando de eliminação com confirmação. A apresentação é responsiva e o controlo é acessível por teclado.

Esta é uma superfície de controlo da Fase 7, não a interface de chat final.

## Testes

- Testes unitários para janela de contexto, truncagem, limites de armazenamento e cálculo da retenção.
- Playwright Chromium para consentimento inicialmente desligado, rejeição de escrita sem autorização, criação de sessão, persistência de mensagens em IndexedDB, recuperação após reload, limite de seis mensagens no contexto, eliminação da base de dados e ausência de pedidos externos durante o fluxo.
- Playwright em viewport móvel para verificar a disponibilidade dos controlos.

Os resultados finais são registados após o workflow GitHub Actions desta implementação.

## Estado dos critérios

| Critério | Estado |
|---|---|
| Sessões locais | Implementado |
| Histórico em IndexedDB | Implementado |
| Consentimento explícito | Implementado |
| Consentimento desligado por defeito | Implementado |
| Limites de armazenamento e retenção | Implementado |
| Contexto limitado a 6 mensagens / 500 caracteres | Implementado |
| Eliminação efectiva da base de dados local | Implementado |
| Tratamento de IndexedDB indisponível ou bloqueado | Implementado |
| Testes unitários | Implementados; CI a confirmar |
| Testes reais no Chromium | Implementados; CI a confirmar |
| Ausência de pedidos externos no fluxo de memória testado | CI a confirmar |
| Integração com UI de conversação final | Pendente, Fase 8 |
| Prova física WebGPU e avaliação de respostas | Pendente, Fases 3/9 |

## Decisões

- Não foi adicionada qualquer dependência.
- Não foi introduzido localStorage, backend, telemetria ou sincronização.
- O consentimento fica armazenado no mesmo IndexedDB e é apagado com os restantes dados.
- A memória conversacional nunca escreve no catálogo profissional.
- O título das sessões é genérico para evitar persistir automaticamente conteúdo ou dados pessoais.

## Próximo passo

A Fase 8 poderá ligar `createSession`, `appendMessage` e `getAgentHistory` à interface conversacional. A interface deve continuar funcional com a memória desactivada e apresentar claramente quando o histórico não está a ser guardado.
