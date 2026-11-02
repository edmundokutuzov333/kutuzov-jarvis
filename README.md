# Kutuzov JARVIS

Assistente digital especializado no percurso, trabalho e identidade profissional de Kutuzov.

**Arquitectura pretendida:** browser-first, inteligência local, sem API de inferência remota e sem servidor dedicado.

> Estado: Fase 0, fundação do repositório. A aplicação ainda não foi implementada.

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
- Portefólio oficial, apenas como fonte de referência durante a investigação: [edmundokutuzov333/kutuzovportfolio333](https://github.com/edmundokutuzov333/kutuzovportfolio333)

Não alterar o repositório oficial durante as fases de desenvolvimento independente.

## Estado das fases

| Fase | Estado |
|---|---|
| 0. Fundação do repositório | Em preparação |
| 1. Investigação e auditoria | Não iniciada |
| 2. Fundação técnica | Não iniciada |
| 3. Motor de inteligência local | Não iniciada |
| 4. Knowledge Engine | Não iniciada |
| 5. Agent Core | Não iniciada |
| 6. Action Engine | Não iniciada |
| 7. Memória e privacidade | Não iniciada |
| 8. Interface | Não iniciada |
| 9. Testes e optimização | Não iniciada |
| 10. Preparação da integração | Não iniciada |

## Documentação

- [Fase 0: fundação](docs/PHASE-0.md)
- [Arquitectura inicial](docs/ARCHITECTURE.md)
- [Decisões técnicas](docs/DECISIONS.md)
- [Base de segurança](docs/SECURITY-BASELINE.md)
- [Fronteira de integração](docs/INTEGRATION-CONTRACT.md)
- [Regras para agentes de desenvolvimento](AGENTS.md)

## Estado técnico actual

Esta fase prepara o repositório e as regras de trabalho. Não selecciona um modelo, não instala WebLLM, não implementa componentes React e não declara compatibilidade WebGPU.

Essas decisões pertencem à investigação da Fase 1 e à implementação das fases seguintes.

## Licença

Ainda não foi adicionada uma licença de software. A licença só deverá ser definida após decisão explícita do proprietário.
