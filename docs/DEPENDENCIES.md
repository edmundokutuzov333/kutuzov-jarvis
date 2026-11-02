# Dependências da fundação técnica

**Actualizado:** 2 de Novembro de 2026  
**Fase:** 2

As versões directas estão fixadas sem intervalos semver para evitar actualizações silenciosas. A instalação e resolução transitiva são verificadas pelo workflow GitHub Actions.

## Runtime

| Pacote | Versão | Finalidade |
|---|---:|---|
| react | 19.3.1 | Componentes e estado da interface |
| react-dom | 19.3.1 | Renderização no browser |
| zod | 4.6.7 | Schemas de domínio e validação de dados |

## Desenvolvimento e qualidade

| Pacote | Versão | Finalidade |
|---|---:|---|
| vite | 8.3.5 | Servidor de desenvolvimento e build estático |
| @vitejs/plugin-react | 6.1.2 | JSX e React Fast Refresh |
| typescript | 5.9.3 | Verificação estática, em versão suportada pelo typescript-eslint consultado |
| typescript-eslint | 8.72.1 | Parser e regras TypeScript para ESLint |
| eslint | 10.14.0 | Análise estática |
| @eslint/js | 10.0.1 | Regras base recomendadas |
| eslint-plugin-react-hooks | 7.1.1 | Regras para React Hooks |
| eslint-plugin-react-refresh | 0.5.7 | Verificação de exports compatíveis com Fast Refresh |
| vitest | 4.1.10 | Testes unitários e de domínio |
| @playwright/test | 1.64.1 | Smoke tests reais no browser |
| @types/node | 22.20.5 | Tipos para a toolchain Node 22 |
| @types/react | 19.3.0 | Tipos React |
| @types/react-dom | 19.3.0 | Tipos React DOM |

## Dependências deliberadamente excluídas

- WebLLM: pertence à Fase 3 e deve permanecer fora da carga inicial.
- Transformers.js e modelos de voz: fase posterior.
- Supabase/Firebase/PostgreSQL: não são necessários para a aplicação independente.
- Vector databases e embeddings: não necessários para a primeira versão da Knowledge Base.
- Bibliotecas de ícones e animação: não necessárias na fundação.
- Backend e frameworks de servidor: fora da arquitectura aprovada.

## Node

O projecto declara Node.js >=22.12.0, alinhado com os requisitos actuais de Vite e Vitest. O workflow utiliza Node 22.16.0.

## Lockfile

O workflow gera o package-lock.json se ainda não existir e preserva-o como artefacto. O ambiente de execução desta alteração não tinha acesso ao registry npm, por isso não foi possível gerar e verificar localmente um lockfile completo. A primeira execução do CI valida a resolução e disponibiliza o ficheiro para ser incorporado no repositório.
