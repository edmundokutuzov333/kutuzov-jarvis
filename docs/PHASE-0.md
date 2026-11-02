# Fase 0: fundação do repositório

**Estado:** Concluída após verificação dos itens abaixo.  
**Âmbito:** preparação anterior à Fase 1. Não inclui investigação técnica aprofundada nem implementação da aplicação.

## Objectivo
Criar uma base de trabalho segura, rastreável e independente para o KUTUZOV JARVIS, estabelecendo a missão, os limites arquitecturais, as regras de execução e a documentação mínima.

## Actividades da Fase 0

| Actividade | Resultado esperado |
|---|---|
| Confirmar repositório e permissões | Repositório correcto, acesso de escrita e branch principal identificados |
| Inicializar branch principal | Primeiro commit em main |
| Definir missão e âmbito | Produto especializado em Kutuzov, não um agente geral |
| Definir limites | Browser-first, sem API de inferência e sem backend de IA |
| Definir regras permanentes | AGENTS.md |
| Documentar arquitectura preliminar | Componentes e limites de responsabilidade, sem fixar soluções ainda não investigadas |
| Registar decisões | Decisões aceites e assuntos por investigar separados |
| Definir base de segurança | Privacidade local, ferramentas permitidas e proibições |
| Definir fronteira de integração | Portefólio oficial permanece intocado |

## Fora do âmbito
Não faz parte da Fase 0:
- Auditoria aprofundada do OpenJarvis.
- Auditoria do CMS ou do conteúdo actual do portefólio.
- Benchmark ou selecção do modelo.
- Escolha da quantização.
- Instalação de WebLLM ou Transformers.js.
- Criação de aplicação React/Vite.
- Implementação de Knowledge Engine.
- Implementação de Agent Core ou Action Engine.
- Implementação de voz.
- Deploy de uma aplicação.
- Alterações ao portefólio oficial.

Estes trabalhos pertencem às fases seguintes.

## Critérios de saída
- [x] Repositório correcto confirmado.
- [x] Permissão de escrita confirmada.
- [x] Branch main inicializada.
- [x] README criado.
- [x] Regras de execução documentadas.
- [x] Arquitectura preliminar documentada.
- [x] Decisões iniciais registadas.
- [x] Base de segurança documentada.
- [x] Fronteira de integração documentada.
- [x] Nenhuma alteração feita ao portefólio oficial.
- [x] Nenhum runtime, modelo ou serviço de inferência instalado.

## Resultado
A Fase 0 prepara o repositório para iniciar a Fase 1 com uma base clara. Não representa uma aplicação funcional e não valida ainda WebGPU, modelos, qualidade de respostas ou desempenho.

## Próximo passo
**Fase 1: investigação e auditoria.** Auditar o OpenJarvis, o portefólio oficial em modo de leitura, a documentação actual do WebLLM, os modelos compatíveis, as licenças e os requisitos de equipamento. Nenhuma decisão de modelo deve ser tratada como aprovada antes dessa investigação.
