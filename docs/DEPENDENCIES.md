# Dependências da fundação técnica

**Actualizado:** 2 de Novembro de 2026  
**Fase:** 2, concluída e validada.

As versões directas estão fixadas sem intervalos semver. A resolução transitiva fica registada em `package-lock.json`.

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
| typescript | 5.9.3 | Verificação estática |
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

## Node e npm

- Node.js mínimo declarado: 22.12.0.
- Node.js utilizado no workflow: 22.16.0.
- npm fixado no workflow: 11.21.1.
- O package.json declara `packageManager: npm@11.21.1`.

## Lockfile e instalação reproduzível

O ficheiro `package-lock.json` está incorporado na branch `main`, com lockfileVersion 3 e 110,387 bytes no momento da validação. Foi gerado pelo workflow GitHub Actions e passou pela instalação `npm ci --legacy-peer-deps` no mesmo ciclo de validação.

A execução local recomendada é:

```bash
npm ci --legacy-peer-deps
```

O workflow verifica a existência do lockfile. Se faltar numa execução de push para `main`, gera-o e só o incorpora depois de todos os gates passarem. O lockfile também é preservado como artefacto do workflow.
