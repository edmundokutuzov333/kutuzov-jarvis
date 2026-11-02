# Kutuzov JARVIS

Assistente digital especializado no percurso, trabalho e identidade profissional de Kutuzov.

**Arquitectura:** browser-first, inteligência local, sem API de inferência remota e sem servidor dedicado.

> Estado: Fase 0 concluída. Fase 1 concluída com ressalva técnica. Fase 2 implementada; validação CI e lockfile pendentes. O runtime de IA ainda não foi integrado.

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
| 2. Fundação técnica | Implementada; validação CI pendente |
| 3. Motor de inteligência local | Não iniciada |
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

Criada uma aplicação independente com React 19, TypeScript estrito e Vite. Inclui configurações de lint, testes unitários, Playwright e GitHub Actions. A estrutura separa interface, domínio, conhecimento, runtime, acções e adaptadores de browser.

O ecrã actual é apenas uma página técnica de fundação. Não existe ainda conversa, inferência local, Knowledge Base ou integração com o portefólio. Os estados apresentados identificam explicitamente os subsistemas não implementados.

### Executar localmente

Requisitos: Node.js 22.12.0 ou superior.

```bash
npm install
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

O workflow de CI executa os mesmos gates e prepara o lockfile npm. O lockfile ainda precisa de ser incorporado depois da primeira resolução de dependências no CI.

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

## Estado técnico

A Fase 2 prepara a aplicação, mas não declara o modelo escolhido como funcional. O runtime de IA, os dados profissionais, a recuperação, a memória, as acções e a experiência conversacional serão adicionados nas fases previstas.

O portefólio oficial mantém-se independente e sem alterações.

## Licença

Ainda não foi adicionada uma licença de software. A licença só deverá ser definida após decisão explícita do proprietário.
