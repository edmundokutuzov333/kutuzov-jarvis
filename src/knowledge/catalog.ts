import {
  KNOWLEDGE_SCHEMA_VERSION,
  KnowledgeCatalogSchema,
  type KnowledgeEntry,
  type KnowledgeKind,
} from "./schema";

type Metadata = Record<string, string | number | boolean | string[]>;

const AUDIT_PATH = "docs/PORTFOLIO-DATA-AUDIT.md";
const SNAPSHOT_DATE = "2026-11-02";

function publicFact(
  id: string,
  kind: KnowledgeKind,
  title: string,
  content: string,
  keywords: string[],
  entity: string,
  metadata: Metadata = {},
  entities: string[] = [],
): KnowledgeEntry {
  return {
    id,
    kind,
    title,
    content,
    keywords,
    entities,
    published: true,
    visibility: "public_fact",
    verification: "verified_snapshot",
    source: {
      type: "portfolio_cms_snapshot",
      path: AUDIT_PATH,
      entity,
      capturedAt: SNAPSHOT_DATE,
    },
    metadata,
  };
}

function editorialGuardrail(
  id: string,
  title: string,
  content: string,
  keywords: string[],
  entity: string,
): KnowledgeEntry {
  return {
    id,
    kind: "limitation",
    title,
    content,
    keywords,
    entities: [],
    published: false,
    visibility: "internal_guardrail",
    verification: "pending_editorial",
    source: {
      type: "portfolio_audit_note",
      path: AUDIT_PATH,
      entity,
      capturedAt: SNAPSHOT_DATE,
    },
    metadata: {},
  };
}

const records: KnowledgeEntry[] = [
  publicFact(
    "identity.public-profile",
    "identity",
    "Perfil público de Edmundo Kutuzov",
    "O perfil público identifica Edmundo Kutuzov como Art Director. Os cargos/áreas adicionais publicados são Social Media Manager, AI Expert e Content Creator. A localização publicada é Maputo, Moçambique.",
    ["Kutuzov", "Edmundo", "perfil", "identidade", "art director", "social media manager", "ai expert", "content creator", "Maputo", "creative"],
    "profile_content",
    {
      name: "Edmundo Kutuzov",
      primaryRole: "Art Director",
      roles: ["Art Director", "Social Media Manager", "AI Expert", "Content Creator"],
      location: "Maputo, Moçambique",
    },
    ["Edmundo Kutuzov", "Kutuzov", "Maputo"],
  ),
  publicFact(
    "identity.published-positioning",
    "identity",
    "Posicionamento publicado",
    "Headline publicada: “I make ideas stop, take notice, stay in memory, and act.” O texto introdutório publicado apresenta Kutuzov como art director de Maputo, a trabalhar globalmente, com foco em sistemas de marca que conquistam atenção. O mesmo texto declara “30+ brands”.",
    ["headline", "posicionamento", "brand systems", "marcas", "atenção", "attention", "criatividade", "creative direction"],
    "profile_content",
    {
      headline: "I make ideas stop, take notice, stay in memory, and act.",
      intro: "I'm Edmundo Kutuzov, an art director from Maputo operating globally, building brand systems that earn attention rather than beg for it. 30+ brands. One obsession: work that refuses to be ignored.",
    },
    ["Edmundo Kutuzov", "Maputo"],
  ),

  publicFact("experience.webmasters", "experience", "WEBMASTERS Limitada", "Experiência publicada: Art Director & Content Creator na WEBMASTERS Limitada, de 2024 até ao presente, segundo o snapshot de 2 de Novembro de 2026.", ["experiência", "experience", "career", "empresa", "company", "art director", "content creator"], "experience_items", { organization: "WEBMASTERS Limitada", role: "Art Director & Content Creator", period: "2024 - Present" }, ["WEBMASTERS Limitada"]),
  publicFact("experience.spot", "experience", "SPOT Comunicação", "Experiência publicada: Art Director na SPOT Comunicação, de 2023 a 2024.", ["experiência", "experience", "career", "empresa", "company", "art director"], "experience_items", { organization: "SPOT Comunicação", role: "Art Director", period: "2023 - 2024" }, ["SPOT Comunicação"]),
  publicFact("experience.ikigai", "experience", "Ikigai Moçambique", "Experiência publicada: Senior Graphic Designer na Ikigai Moçambique, em 2023.", ["experiência", "experience", "career", "empresa", "company", "senior graphic designer", "design gráfico"], "experience_items", { organization: "Ikigai Moçambique", role: "Senior Graphic Designer", period: "2023" }, ["Ikigai Moçambique"]),
  publicFact("experience.imperial", "experience", "Imperial Seguros", "Experiência publicada: Marketing Assistant & Social Media Manager na Imperial Seguros, em 2023.", ["experiência", "experience", "career", "empresa", "company", "marketing assistant", "social media manager"], "experience_items", { organization: "Imperial Seguros", role: "Marketing Assistant & Social Media Manager", period: "2023" }, ["Imperial Seguros"]),
  publicFact("experience.creer", "experience", "Agência Creer", "Experiência publicada: Graphic Designer na Agência Creer, de 2020 a 2023.", ["experiência", "experience", "career", "empresa", "company", "graphic designer", "design gráfico"], "experience_items", { organization: "Agência Creer", role: "Graphic Designer", period: "2020 - 2023" }, ["Agência Creer"]),

  publicFact("project.diga-yes", "project", "Diga YES & Viva o Mundo Online", "Projecto publicado com o slug diga-yes. Cliente apresentado: Webmasters / YES. Ano publicado: 2026. Disciplina: Campaign Design.", ["projectos", "projetos", "projects", "work", "campaign", "campaign design", "diga yes", "yes", "webmasters"], "projects", { slug: "diga-yes", client: "Webmasters / YES", year: "2026", discipline: "Campaign Design", featured: true, roleConfirmed: false }, ["Diga YES", "Webmasters", "YES"]),
  publicFact("project.jogue-venca-repita", "project", "Jogue, Vença, Repita.", "Projecto publicado com o slug jogue-venca-repita. Cliente apresentado: Webmasters. Ano publicado: 2026. Disciplina: Social Media.", ["projectos", "projetos", "projects", "work", "social media", "jogue venca repita", "webmasters"], "projects", { slug: "jogue-venca-repita", client: "Webmasters", year: "2026", discipline: "Social Media", featured: true, roleConfirmed: false }, ["Jogue, Vença, Repita.", "Webmasters"]),
  publicFact("project.datas-que-ligam", "project", "Datas que Ligam", "Projecto publicado com o slug datas-que-ligam. Cliente apresentado: Webmasters / YES. Período publicado: 2025 - 2026. Disciplina: Content Creation.", ["projectos", "projetos", "projects", "work", "content creation", "datas que ligam", "webmasters", "yes"], "projects", { slug: "datas-que-ligam", client: "Webmasters / YES", year: "2025 - 2026", discipline: "Content Creation", featured: true, roleConfirmed: false }, ["Datas que Ligam", "Webmasters", "YES"]),
  publicFact("project.somos-uma", "project", "Somos Uma", "Projecto publicado com o slug somos-uma. Cliente apresentado: Webmasters. Ano publicado: 2026. Disciplina: Art Direction.", ["projectos", "projetos", "projects", "work", "art direction", "somos uma", "webmasters"], "projects", { slug: "somos-uma", client: "Webmasters", year: "2026", discipline: "Art Direction", featured: true, roleConfirmed: false }, ["Somos Uma", "Webmasters"]),

  publicFact("client.absa", "client", "Absa", "Absa consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands"], "clients", { name: "Absa" }, ["Absa"]),
  publicFact("client.toyota", "client", "Toyota Moçambique", "Toyota Moçambique consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "automóvel"], "clients", { name: "Toyota Moçambique" }, ["Toyota Moçambique", "Toyota"]),
  publicFact("client.nissan", "client", "Nissan Moçambique", "Nissan Moçambique consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "automóvel"], "clients", { name: "Nissan Moçambique" }, ["Nissan Moçambique", "Nissan"]),
  publicFact("client.hyundai", "client", "Hyundai Moçambique", "Hyundai Moçambique consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "automóvel"], "clients", { name: "Hyundai Moçambique" }, ["Hyundai Moçambique", "Hyundai"]),
  publicFact("client.galp", "client", "Galp", "Galp consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "energia"], "clients", { name: "Galp" }, ["Galp"]),
  publicFact("client.totalenergies", "client", "TotalEnergies", "TotalEnergies consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "energia"], "clients", { name: "TotalEnergies" }, ["TotalEnergies"]),
  publicFact("client.vodacom", "client", "Vodacom", "Vodacom consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "telecomunicações"], "clients", { name: "Vodacom" }, ["Vodacom"]),
  publicFact("client.ronil-auto", "client", "Ronil Auto Moçambique", "Ronil Auto Moçambique consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "automóvel"], "clients", { name: "Ronil Auto Moçambique" }, ["Ronil Auto Moçambique", "Ronil Auto"]),
  publicFact("client.pernod-ricard", "client", "Pernod Ricard Moçambique", "Pernod Ricard Moçambique consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands"], "clients", { name: "Pernod Ricard Moçambique" }, ["Pernod Ricard Moçambique", "Pernod Ricard"]),
  publicFact("client.giz", "client", "GIZ", "GIZ consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands"], "clients", { name: "GIZ" }, ["GIZ"]),
  publicFact("client.multichoice", "client", "MultiChoice (DStv & GOtv)", "MultiChoice (DStv & GOtv) consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "media", "televisão"], "clients", { name: "MultiChoice (DStv & GOtv)" }, ["MultiChoice", "DStv", "GOtv"]),
  publicFact("client.kitkat", "client", "KitKat", "KitKat consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands"], "clients", { name: "KitKat" }, ["KitKat"]),
  publicFact("client.flying-fish", "client", "Flying Fish", "Flying Fish consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands"], "clients", { name: "Flying Fish" }, ["Flying Fish"]),
  publicFact("client.brutal-fruit", "client", "Brutal Fruit", "Brutal Fruit consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands"], "clients", { name: "Brutal Fruit" }, ["Brutal Fruit"]),
  publicFact("client.joaquim-chaves", "client", "Joaquim Chaves Saúde", "Joaquim Chaves Saúde consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "saúde"], "clients", { name: "Joaquim Chaves Saúde" }, ["Joaquim Chaves Saúde"]),
  publicFact("client.ponta-apart", "client", "Ponta Apart Hotel", "Ponta Apart Hotel consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "hotelaria"], "clients", { name: "Ponta Apart Hotel" }, ["Ponta Apart Hotel"]),
  publicFact("client.hotel-cardoso", "client", "Hotel Cardoso", "Hotel Cardoso consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "hotelaria"], "clients", { name: "Hotel Cardoso" }, ["Hotel Cardoso"]),
  publicFact("client.emose", "client", "EMOSE", "EMOSE consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "seguros"], "clients", { name: "EMOSE" }, ["EMOSE"]),
  publicFact("client.mocambique-seguros", "client", "Moçambique Companhia de Seguros", "Moçambique Companhia de Seguros consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands", "seguros"], "clients", { name: "Moçambique Companhia de Seguros" }, ["Moçambique Companhia de Seguros"]),
  publicFact("client.promar", "client", "PROMAR", "PROMAR consta como cliente/marca visível na página pública de clientes do portefólio.", ["cliente", "clientes", "client", "clients", "marca", "marcas", "brand", "brands"], "clients", { name: "PROMAR" }, ["PROMAR"]),

  publicFact("service.visual-identity", "service", "Visual Identity", "Visual Identity consta como serviço publicado no portefólio.", ["serviço", "serviços", "service", "services", "identidade visual", "branding", "brand identity"], "services", { name: "Visual Identity" }, ["Visual Identity"]),
  publicFact("service.art-direction", "service", "Art Direction", "Art Direction consta como serviço publicado no portefólio.", ["serviço", "serviços", "service", "services", "direcção de arte", "direção de arte", "art direction"], "services", { name: "Art Direction" }, ["Art Direction"]),
  publicFact("service.editorial-print", "service", "Editorial & Print", "Editorial & Print consta como serviço publicado no portefólio.", ["serviço", "serviços", "service", "services", "editorial", "print", "publicações", "impressão"], "services", { name: "Editorial & Print" }, ["Editorial & Print"]),
  publicFact("service.digital-design", "service", "Digital Design", "Digital Design consta como serviço publicado no portefólio.", ["serviço", "serviços", "service", "services", "design digital", "digital design", "ui ux"], "services", { name: "Digital Design" }, ["Digital Design"]),
  publicFact("service.ai-creative-direction", "service", "AI Creative Direction", "AI Creative Direction consta como serviço publicado no portefólio.", ["serviço", "serviços", "service", "services", "inteligência artificial", "artificial intelligence", "ai", "creative direction"], "services", { name: "AI Creative Direction" }, ["AI Creative Direction"]),

  publicFact("skill.photoshop", "skill", "Adobe Photoshop", "Adobe Photoshop aparece no CMS com pontuação publicada de 95 e nível Core.", ["competências", "competencias", "skills", "software", "ferramentas", "photoshop", "adobe"], "skills", { name: "Adobe Photoshop", score: 95, level: "Core", scoreContext: "portfolio_published_value" }, ["Adobe Photoshop"]),
  publicFact("skill.ai", "skill", "Artificial Intelligence", "Artificial Intelligence aparece no CMS com pontuação publicada de 95 e nível Core.", ["competências", "competencias", "skills", "inteligência artificial", "artificial intelligence", "ai"], "skills", { name: "Artificial Intelligence", score: 95, level: "Core", scoreContext: "portfolio_published_value" }, ["Artificial Intelligence", "AI"]),
  publicFact("skill.illustrator", "skill", "Adobe Illustrator", "Adobe Illustrator aparece no CMS com pontuação publicada de 75 e nível Fluent.", ["competências", "competencias", "skills", "software", "ferramentas", "illustrator", "adobe"], "skills", { name: "Adobe Illustrator", score: 75, level: "Fluent", scoreContext: "portfolio_published_value" }, ["Adobe Illustrator"]),
  publicFact("skill.premiere", "skill", "Adobe Premiere", "Adobe Premiere aparece no CMS com pontuação publicada de 75 e nível Fluent.", ["competências", "competencias", "skills", "software", "ferramentas", "premiere", "adobe", "video"], "skills", { name: "Adobe Premiere", score: 75, level: "Fluent", scoreContext: "portfolio_published_value" }, ["Adobe Premiere"]),
  publicFact("skill.after-effects", "skill", "Adobe After Effects", "Adobe After Effects aparece no CMS com pontuação publicada de 45 e nível Exploring.", ["competências", "competencias", "skills", "software", "ferramentas", "after effects", "adobe", "motion"], "skills", { name: "Adobe After Effects", score: 45, level: "Exploring", scoreContext: "portfolio_published_value" }, ["Adobe After Effects"]),

  publicFact("discipline.core", "discipline", "Core Disciplines", "O grupo Core Disciplines publicado inclui Art Direction, Brand Identity Systems, Campaign Design, Creative Direction e Visual Hierarchy & Typography.", ["disciplinas", "discipline", "core", "art direction", "brand identity", "campaign design", "creative direction", "typography"], "disciplines", { group: "Core Disciplines", items: ["Art Direction", "Brand Identity Systems", "Campaign Design", "Creative Direction", "Visual Hierarchy & Typography"] }),
  publicFact("discipline.digital-motion", "discipline", "Digital & Motion", "O grupo Digital & Motion publicado inclui Social-First Content Systems, Motion Design & Key Art, UI/UX Design Systems, AI Creative Direction e Audiovisual Storytelling.", ["disciplinas", "discipline", "digital", "motion", "social-first", "ui ux", "audiovisual", "storytelling"], "disciplines", { group: "Digital & Motion", items: ["Social-First Content Systems", "Motion Design & Key Art", "UI/UX Design Systems", "AI Creative Direction", "Audiovisual Storytelling"] }),
  publicFact("discipline.print-special", "discipline", "Print & Special Projects", "O grupo Print & Special Projects publicado inclui Editorial & Publications, Large-Format OOH Billboards, Packaging & Print Prep, Music Video & Single Rollouts e Streetwear Curation.", ["disciplinas", "discipline", "print", "editorial", "publications", "ooh", "packaging", "music video", "streetwear"], "disciplines", { group: "Print & Special Projects", items: ["Editorial & Publications", "Large-Format OOH Billboards", "Packaging & Print Prep", "Music Video & Single Rollouts", "Streetwear Curation"] }),

  publicFact("principle.clarity", "principle", "Clarity", "Clarity consta como um dos princípios publicados no portefólio.", ["princípios", "principios", "philosophy", "clareza", "clarity", "filosofia criativa"], "principles", { name: "Clarity" }, ["Clarity"]),
  publicFact("principle.rhythm", "principle", "Rhythm", "Rhythm consta como um dos princípios publicados no portefólio.", ["princípios", "principios", "philosophy", "ritmo", "rhythm", "filosofia criativa"], "principles", { name: "Rhythm" }, ["Rhythm"]),
  publicFact("principle.precision", "principle", "Precision", "Precision consta como um dos princípios publicados no portefólio.", ["princípios", "principios", "philosophy", "precisão", "precision", "filosofia criativa"], "principles", { name: "Precision" }, ["Precision"]),
  publicFact("principle.memory", "principle", "Memory", "Memory consta como um dos princípios publicados no portefólio.", ["princípios", "principios", "philosophy", "memória", "memory", "filosofia criativa"], "principles", { name: "Memory" }, ["Memory"]),

  publicFact("process.discovery", "process_step", "Discovery & Immersion", "Discovery & Immersion é a primeira etapa do processo criativo publicado.", ["processo", "process", "etapas", "steps", "discovery", "immersion", "descoberta", "imersão"], "process_steps", { order: 1, name: "Discovery & Immersion" }),
  publicFact("process.direction", "process_step", "Strategic Direction", "Strategic Direction é a segunda etapa do processo criativo publicado.", ["processo", "process", "etapas", "steps", "strategic direction", "estratégia"], "process_steps", { order: 2, name: "Strategic Direction" }),
  publicFact("process.design", "process_step", "Design & Craft", "Design & Craft é a terceira etapa do processo criativo publicado.", ["processo", "process", "etapas", "steps", "design", "craft", "execução", "produção"], "process_steps", { order: 3, name: "Design & Craft" }),
  publicFact("process.rollout", "process_step", "Production & Rollout", "Production & Rollout é a quarta etapa do processo criativo publicado.", ["processo", "process", "etapas", "steps", "production", "rollout", "implementação"], "process_steps", { order: 4, name: "Production & Rollout" }),

  publicFact("metric.years", "metric", "7+ Years", "O portefólio apresenta a métrica “7+ Years”.", ["métricas", "metric", "anos", "years", "experiência"], "metrics", { value: "7+ Years", scope: "portfolio_reported" }),
  publicFact("metric.projects", "metric", "150+ Projects", "O portefólio apresenta a métrica “150+ Projects”.", ["métricas", "metric", "projectos", "projetos", "projects", "trabalhos"], "metrics", { value: "150+ Projects", scope: "portfolio_reported" }),
  publicFact("metric.brands", "metric", "30+ Brands", "O portefólio apresenta a métrica “30+ Brands”.", ["métricas", "metric", "marcas", "brands", "clientes"], "metrics", { value: "30+ Brands", scope: "portfolio_reported" }),
  publicFact("metric.continents", "metric", "3 Continents", "O portefólio apresenta a métrica “3 Continents”.", ["métricas", "metric", "continentes", "continents", "global"], "metrics", { value: "3 Continents", scope: "portfolio_reported" }),
  publicFact("metric.capability", "metric", "360º Capability", "O portefólio apresenta a métrica “360º Capability”.", ["métricas", "metric", "capacidade", "capability", "360"], "metrics", { value: "360º Capability", scope: "portfolio_reported" }),

  editorialGuardrail(
    "limitation.biography-pending",
    "Biografia pendente de confirmação editorial",
    "O campo biography do registo público de perfil estava NULL no snapshot consultado. Existe conteúdo rich_text publicado na página About, mas o componente inspeccionado usa um fallback estático diferente. Não construir nem apresentar uma biografia consolidada até haver confirmação editorial explícita.",
    ["biografia", "biography", "bio", "about", "sobre", "percurso", "quem é kutuzov", "quem sou"],
    "profile_content / page_sections / About fallback",
  ),
  editorialGuardrail(
    "limitation.project-roles-unconfirmed",
    "Papel individual nos projectos não confirmado",
    "A tabela pública projects não contém campo role e o schema ProjectRow também não define esse campo. A etiqueta Role / Art Direction apresentada no componente não prova que essa tenha sido a função individual de Kutuzov em cada caso. Não atribuir responsabilidades por projecto sem confirmação específica.",
    ["papel", "função", "responsabilidade", "role", "projectos", "projetos", "projects", "diga yes", "jogue vença repita", "datas que ligam", "somos uma"],
    "projects schema / ProjectRow / project detail component",
  ),
  editorialGuardrail(
    "limitation.metrics-not-audited",
    "Métricas são declarações do portefólio",
    "As métricas são valores publicados na página do portefólio. Devem ser apresentadas como valores indicados pelo portefólio, sem as descrever como auditoria externa, certificação ou resultado verificado por terceiros.",
    ["métricas", "metric", "resultados", "anos", "projects", "brands", "continents", "capability"],
    "metrics",
  ),
  editorialGuardrail(
    "limitation.skill-scores-not-assessed",
    "Pontuações de competências são valores do CMS",
    "Os valores numéricos e níveis das competências são os que aparecem publicados no CMS. Não os apresentar como resultado de exame, certificação ou avaliação independente.",
    ["competências", "competencias", "skills", "pontuação", "score", "nível", "level", "photoshop", "illustrator", "premiere", "after effects"],
    "skills",
  ),
];

export const KNOWLEDGE_CATALOG = KnowledgeCatalogSchema.parse({
  schemaVersion: KNOWLEDGE_SCHEMA_VERSION,
  snapshotDate: SNAPSHOT_DATE,
  sourceDocument: AUDIT_PATH,
  records,
});

export const KNOWLEDGE_RECORD_COUNT = KNOWLEDGE_CATALOG.records.length;
