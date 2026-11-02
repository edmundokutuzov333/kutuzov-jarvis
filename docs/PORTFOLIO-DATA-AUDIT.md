# Auditoria de dados públicos do KutuzovPortfolio333

**Data da auditoria:** 2 de Novembro de 2026  
**Repositório inspeccionado:** https://github.com/edmundokutuzov333/kutuzovportfolio333  
**Branch:** main  
**Commit observado:** 16c535a7fd368d2aee11dd80728d42e6eb0ebe67  
**Modo:** leitura de código e consultas SELECT read-only ao CMS.

## 1. Resultado executivo

O portefólio utiliza um CMS público em Supabase. As páginas consomem dados publicados por queries específicas e validam os registos com schemas Zod.

A fonte de verdade do JARVIS deve ser o conteúdo público publicado no CMS, não o conjunto completo de constantes de src/lib/content.ts.

No momento da consulta, foram observados:

| Entidade | Registos publicados/visíveis |
|---|---:|
| Páginas | 8 |
| Perfil | 1 |
| Projectos | 4 |
| Clientes visíveis | 20 |
| Experiência | 5 |
| Competências | 5 |
| Métricas | 5 |
| Disciplinas | 3 |
| Princípios | 4 |
| Serviços | 5 |
| Etapas de processo | 4 |

As contagens são um snapshot do CMS em 2 de Novembro de 2026 e podem mudar quando o conteúdo for publicado.

## 2. Rotas e páginas

A rota tree gerada e os ficheiros de rota incluem:
- /
- /work
- /work/:slug
- /about
- /services
- /process
- /clients
- /contact
- /newsletter/confirm
- /newsletter/unsubscribe
- /admin

As páginas públicas de conteúdo para o assistente são Home, Work, Project Detail, About, Services, Process e Clients. Contact deverá ser usado apenas para navegar o visitante para a página de contacto, sem recolher ou consultar pedidos de contacto.

Não expor /admin, newsletters, formulários privados, pedidos recebidos ou funções administrativas ao JARVIS.

No CMS, as 8 páginas publicadas observadas eram:
- Home (/), locale en.
- About & Credentials (/about), locale en.
- Clients (/clients), locale en.
- Contact (/contact), locale en.
- Process (/process), locale en.
- Services (/services), locale en.
- Work (/work), locale en.
- Project case study (/work/:slug), locale pt-MZ.

A existência de um locale pt-MZ na página de case study não significa que todos os projectos publicados tenham conteúdo em português. O JARVIS deverá respeitar os dados e a língua do visitante, mas não inventar traduções nem detalhes.

## 3. Fonte de dados e queries

Ficheiros inspeccionados:
- AGENTS.md
- package.json
- src/lib/content.ts
- src/lib/cms/public-client.ts
- src/lib/cms/public-config.ts
- src/lib/cms/queries.ts
- src/lib/cms/types.ts
- src/lib/cms/loaders.ts
- src/routes/index.tsx
- src/routes/about.tsx
- src/routes/work.index.tsx
- src/routes/work.$slug.tsx
- src/routeTree.gen.ts

O cliente público do CMS utiliza Supabase REST GET e uma publishable key no browser. O limite de acesso depende das políticas RLS. Não é utilizado service_role no cliente público.

As queries relevantes aplicam filtros de publicação/visibilidade:
- pages: status = published.
- page_sections: is_visible = true, associadas a páginas publicadas.
- profile_content: is_published = true.
- metrics, experience_items, skills, disciplines, principles, services, process_steps: is_published = true.
- clients: is_visible = true e filtros show_on_home/show_on_clients_page quando a página os solicita.
- projects: status = published e featured = true quando solicitados apenas projectos destacados.
- site_settings: is_public = true para as configurações públicas.
- slug_redirects: is_active = true.

O JARVIS não deve consultar tabelas privadas, não deve utilizar credenciais privilegiadas e não deve escrever no CMS.

## 4. Perfil público observado

Campos públicos consultados:
- Nome: Edmundo Kutuzov.
- Role: Art Director.
- Roles: Art Director, Social Media Manager, AI Expert, Content Creator.
- Location: Maputo, Moçambique.
- Headline: “I make ideas stop, take notice, stay in memory, and act.”
- Intro: “I'm Edmundo Kutuzov, an art director from Maputo operating globally, building brand systems that earn attention rather than beg for it. 30+ brands. One obsession: work that refuses to be ignored.”
- biography no registo publicado: NULL.

### Divergência de biografia

O CMS não contém biografia publicada no campo profile_content.biography. O componente About utiliza uma biografia estática de fallback em src/lib/content.ts quando esse campo está vazio.

A tabela page_sections contém uma secção rich_text publicada para /about com dois parágrafos, mas o código da página About inspeccionado utiliza o perfil e o fallback importado, sem usar essa configuração rich_text como fonte da biografia.

**Regra para JARVIS:** não escolher silenciosamente entre duas versões. Até reconciliação editorial, tratar a biografia como pendente de confirmação. Os outros campos do perfil publicados podem ser usados, sempre com origem registada.

Não foram consultados nem incluídos endereço físico, telefone, email pessoal, pedidos de contacto, emails de newsletter ou dados privados.

## 5. Experiência publicada

| Organização | Função | Período |
|---|---|---|
| WEBMASTERS Limitada | Art Director & Content Creator | 2024 - Present |
| SPOT Comunicação | Art Director | 2023 - 2024 |
| Ikigai Moçambique | Senior Graphic Designer | 2023 |
| Imperial Seguros | Marketing Assistant & Social Media Manager | 2023 |
| Agência Creer | Graphic Designer | 2020 - 2023 |

As descrições estão publicadas em experience_items. O JARVIS deve reproduzir os cargos e períodos conforme publicados e não inferir novas responsabilidades.

## 6. Projectos publicados

A tabela projects contém 4 registos com status published no momento da auditoria:

| Slug | Projecto | Cliente | Ano | Disciplina |
|---|---|---|---|---|
| diga-yes | Diga YES & Viva o Mundo Online | Webmasters / YES | 2026 | Campaign Design |
| jogue-venca-repita | Jogue, Vença, Repita. | Webmasters | 2026 | Social Media |
| datas-que-ligam | Datas que Ligam | Webmasters / YES | 2025 - 2026 | Content Creation |
| somos-uma | Somos Uma | Webmasters | 2026 | Art Direction |

Os quatro projectos estão marcados como featured. Os campos summary estavam NULL. Os campos challenge, idea e outcome continham a descrição pública do caso.

### Limitação do campo de função

A estrutura SQL de public.projects não contém coluna role. O schema TypeScript ProjectRow também não define uma propriedade de função desempenhada. O componente de detalhe apresenta a linha Role / Art Direction como texto fixo.

Isto não é prova de que Art Direction tenha sido a função específica de Kutuzov nos quatro projectos.

**Regra para JARVIS:** não afirmar o papel desempenhado por projecto até existir confirmação editorial por projecto, em fonte separada e verificada. A disciplina do projecto não deve ser convertida automaticamente em cargo ou responsabilidade.

## 7. Clientes e marcas visíveis

Os 20 clientes observados estavam is_visible = true e show_on_home = true e show_on_clients_page = true:

1. Absa
2. Toyota Moçambique
3. Nissan Moçambique
4. Hyundai Moçambique
5. Galp
6. TotalEnergies
7. Vodacom
8. Ronil Auto Moçambique
9. Pernod Ricard Moçambique
10. GIZ
11. MultiChoice (DStv & GOtv)
12. KitKat
13. Flying Fish
14. Brutal Fruit
15. Joaquim Chaves Saúde
16. Ponta Apart Hotel
17. Hotel Cardoso
18. EMOSE
19. Moçambique Companhia de Seguros
20. PROMAR

Estes registos provam que os nomes estão publicados como clientes/marcas na página. Não especificam necessariamente o projecto, o ano ou o papel desempenhado em cada relação. O JARVIS não deve inventar essa associação.

## 8. Serviços publicados

1. Visual Identity
2. Art Direction
3. Editorial & Print
4. Digital Design
5. AI Creative Direction

Cada serviço tem descrição, linha curta e lista de entregáveis. Os valores estão publicados em services.

## 9. Competências, disciplinas, princípios e processo

### Competências
- Adobe Photoshop: 95, Core.
- Artificial Intelligence: 95, Core.
- Adobe Illustrator: 75, Fluent.
- Adobe Premiere: 75, Fluent.
- Adobe After Effects: 45, Exploring.

Os valores são os níveis publicados no CMS, não resultados de avaliação independente.

### Grupos de disciplinas
- Core Disciplines: Art Direction, Brand Identity Systems, Campaign Design, Creative Direction, Visual Hierarchy & Typography.
- Digital & Motion: Social-First Content Systems, Motion Design & Key Art, UI/UX Design Systems, AI Creative Direction, Audiovisual Storytelling.
- Print & Special Projects: Editorial & Publications, Large-Format OOH Billboards, Packaging & Print Prep, Music Video & Single Rollouts, Streetwear Curation.

### Princípios
- Clarity.
- Rhythm.
- Precision.
- Memory.

### Etapas do processo
1. Discovery & Immersion.
2. Strategic Direction.
3. Design & Craft.
4. Production & Rollout.

## 10. Métricas públicas

Valores publicados na tabela metrics:
- 7+ Years.
- 150+ Projects.
- 30+ Brands.
- 3 Continents.
- 360º Capability.

O JARVIS pode apresentá-los como métricas indicadas no portefólio. Não deve convertê-los em factos auditados externamente nem prometer que a contagem é automaticamente actualizada.

## 11. content.ts e dados estáticos

src/lib/content.ts contém conteúdo para perfil, biografia, métricas, experiência, skills, disciplinas, serviços, clientes, processo, princípios, tipos de projecto e recursos de trabalhos.

O AGENTS.md do portefólio indica que o texto e os dados placeholder vivem em content.ts. As páginas públicas inspeccionadas usam contudo loaders e queries CMS como fonte principal.

**Regra para JARVIS:** não importar content.ts integralmente. Usar CMS publicado como primeira fonte, comparar o conteúdo estático com o CMS e colocar discrepâncias numa lista de confirmação editorial. Não utilizar placeholders como factos.

## 12. Estratégia de dados para o JARVIS

Durante o desenvolvimento independente:
- Criar uma exportação JSON compacta de conteúdo público aprovado.
- Guardar origem, identificador, data de captura e estado de verificação.
- Excluir dados administrativos, dados de contacto privados, leads e newsletter.
- Não criar um segundo CMS.
- Não criar chaves de escrita.
- Não ligar o projecto independente ao banco de dados do portefólio sem necessidade.

Na integração futura:
- Preferir um adaptador read-only sobre as queries públicas existentes ou um snapshot gerado a partir do CMS.
- Consumir só registos publicados.
- Nunca usar service_role no browser.
- Não criar endpoint de escrita.
- Não ler /admin, contact_submissions, newsletter_subscribers, newsletter_tokens, content_revisions ou tabelas de auditoria para alimentar o assistente.

## 13. Limites da auditoria

- O código e a base de dados foram consultados em modo de leitura.
- Não foram executadas mutações SQL.
- Não foram consultados dados de formulários, newsletter ou auditoria privados.
- O site público foi identificado pelo README, mas a auditoria desta fase incidiu no repositório e no CMS; não foi feito um teste de navegação end-to-end no browser da aplicação publicada.
- Os dados representam o estado observado no dia da auditoria, não uma garantia de que continuarão iguais após futuras publicações.
