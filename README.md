# Kutuzov JARVIS

Assistente digital especializado no percurso, trabalho e identidade profissional de Kutuzov.

**Arquitectura:** browser-first, inteligência local, sem API de inferência remota e sem servidor dedicado.

> Estado: Fase 0 concluída. Fase 1 concluída com ressalva técnica. Fase 2 concluída e validada por CI. Fase 3 implementada e validada por CI; falta validação real de inferência em GPU física.

## Objectivo

O JARVIS deverá ajudar os visitantes do portefólio de Kutuzov a conhecer o seu percurso profissional, explorar projectos, compreender competências e serviços e navegar pelo conteúdo através de uma interface conversacional.

O sistema será especializado numa única pessoa. Não é um assistente geral nem uma plataforma multiagente.

## Princípios

- **Local-first:** a inferência deverá ocorrer no dispositivo do visitante através de WebGPU, quando suportado.
- **Sem API de IA:** não utilizar OpenAI, Gemini, Claude ou outro serviço remoto de inferência.
- **Leve por concepção:** carregar o motor e os pesos do modelo apenas quando o visitante iniciar o assistente.
- **Conhecimento fundamentado:** respostas profissionais devem apoiar-se em informação verificada e identificável.
- **Acções limitadas:** o modelo pode propor comandos, mas a aplicação valida e executa apenas acções autorizadas.
- **Privacidade:** o histórico fica no dispositivo e é controlado pelo visitante.
- **Fallback honesto:** sem WebGPU ou modelo disponível, oferecer pesquisa e navegação determinística sem fingir que existe IA.
- **Integração posterior:** o portefólio oficial permanece separado até o JARVIS independente ser testado e aprovado.

## Repositórios

- Este projecto: [edmundokutuzov333/kutuzov-jarvis](https://github.com/edmundokutuzov333/kutuzov-jarvis)
- Portefólio oficial, apenas como fonte de referência durante o desenvolvimento independente: [edmundokutuzov333/kutuzovportfolio333](https://github.com/edmundokutuzov333/kutuzovportfolio333)

Não alterar o repositório oficial durante as fases independentes.

## Estado das fases

| Fase | Estado |
|---|---|
| 0. Fundação do repositório | Concluída |
| 1. Investigação e auditoria | Concluída com ressalva técnica |
| 2. Fundação técnica | Concluída e validada |
| 3. Local Intelligence Engine | Implementada; validação real WebGPU pendente |
| 4. Knowledge Engine | Não iniciada |
| 5. Agent Core | Não iniciada |
| 6. Action Engine | Não iniciada |
| 7. Memória e privacidade | Não iniciada |
| 8. Interface | Não iniciada |
| 9. Testes e optimização | Não iniciada |
| 10. Preparação da integração | Não iniciada |

## Resultados da Fase 1

- Auditoria do OpenJarvis e dos componentes que vale a pena aproveitar conceptualmente.
- Auditoria read-only do portefólio e do CMS publicado.
- Identificação de 4 projectos publicados e 20 clientes visíveis no snapshot consultado.
- Identificação de discrepâncias na biografia e ausência de papel por projecto.
- Investigação de WebLLM, WebGPU, cache, modelos e licenças.
- Qwen3-0.6B q4f16_1 definido como primeiro candidato a prova; Llama 3.2 1B q4f16_1 mantido como baseline.
- O modelo final ainda não foi aprovado. Falta prova técnica e benchmark em browsers/equipamentos reais.

## Fase 2 / Fundação técnica

Criada uma aplicação independente com React 19, TypeScript estrito e Vite. Inclui ESLint, Vitest, Playwright, GitHub Actions e lockfile npm versionado. A estrutura separa interface, domínio, conhecimento, runtime, acções e adaptadores de browser.

O contrato inicial de mensagem é validado com Zod e tem seis testes unitários. O smoke test do Playwright confirma que a aplicação abre no Chromium e identifica claramente os subsistemas que ainda não estão activos.

O ecrã actual é apenas uma página técnica de fundação. Não existe ainda conversa funcional, inferência local, Knowledge Base, memória ou integração com o portefólio. Os estados apresentados identificam explicitamente os subsistemas não implementados.

### Executar localmente

Requisitos: Node.js 22.12.0 ou superior e npm 11.21.1.

```bash
npm ci --legacy-peer-deps
npm run dev
```

### Verificações

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

### Validação CI

O workflow [JARVIS quality gates](https://github.com/edmundokutuzov333/kutuzov-jarvis/actions/runs/41464575151) concluiu com sucesso:
- TypeScript: aprovado.
- ESLint: aprovado.
- Vitest: 1 ficheiro de testes, 6 testes aprovados.
- Build de produção: aprovado.
- Playwright Chromium: 1 teste de browser aprovado.
- Lockfile: gerado pelo workflow, utilizado no pipeline e incorporado na branch `main`.

O `package-lock.json` está versionado. O workflow instala com `npm ci --legacy-peer-deps` e, quando um lockfile falta numa execução em `main`, gera-o e só o incorpora depois de todos os gates passarem.

## Fase 3 / Local Intelligence Engine

Integrado WebLLM 0.2.87 com o modelo oficial Qwen3-0.6B q4f16_1 MLC. O modelo e a biblioteca WebGPU têm revisões fixadas. O runtime é importado dinamicamente e inicializado num Web Worker apenas depois de o visitante escolher carregar o modelo.

Implementados: detecção WebGPU e contexto seguro, apresentação de capacidades do adaptador, carregamento explícito, progresso, streaming, cancelamento, cache local, limpeza e unload do motor.

O CI passou com 18 testes unitários e 2 testes Chromium. Os testes confirmam que a visita inicial e a verificação de compatibilidade não descarregam os ficheiros do modelo nem os chunks do runtime.

**Modelo:** Qwen3-0.6B q4f16_1, contexto 4096, cerca de 352 MB de ficheiros listados e estimativa WebLLM de 1403.34 MB de VRAM. Os valores são publicados pelo MLC/WebLLM, não medições no equipamento do visitante.

A aceitação final continua pendente de carregar o modelo e gerar texto num dispositivo físico com WebGPU. Não foi feito benchmark de tokens/s ou memória real. A Fase 4 não deve iniciar antes desta validação.

[Consultar a documentação da Fase 3](docs/PHASE-3.md).

## Documentação

- [Fase 0: fundação](docs/PHASE-0.md)
- [Fase 1: investigação e auditoria](docs/PHASE-1.md)
- [Fase 2: fundação técnica](docs/PHASE-2.md)
- [Dependências e versões](docs/DEPENDENCIES.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Decisões técnicas](docs/DECISIONS.md)
- [Auditoria OpenJarvis](docs/OPENJARVIS-AUDIT.md)
- [Auditoria do CMS e do portefólio](docs/PORTFOLIO-DATA-AUDIT.md)
- [Pesquisa WebLLM e modelos](docs/MODEL-RESEARCH.md)
- [Base de segurança](docs/SECURITY-BASELINE.md)
- [Fronteira de integração](docs/INTEGRATION-CONTRACT.md)
- [Regras para agentes de desenvolvimento](AGENTS.md)

## Estado técnico e limites

A Fase 2 valida a fundação técnica, não o produto JARVIS final. WebLLM, WebGPU, pesos de modelos, Knowledge Base, retrieval, Agent Core, Action Engine, memória e interface conversacional continuam por implementar nas fases previstas.

O portefólio oficial mantém-se independente e sem alterações.

## Licença

Ainda não foi adicionada uma licença de software. A licença só deverá ser definida após decisão explícita do proprietário.
