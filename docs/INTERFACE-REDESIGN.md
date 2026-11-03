# Interface pública

## Princípio

A experiência pública deve parecer uma conversa directa com Edmundo Kutuzov. A interface não apresenta o visitante a ferramentas internas, fornecedores de IA, mecanismos de pesquisa, estados de GPU ou painéis de demonstração.

A linguagem usa primeira pessoa, com factos profissionais confirmados na Knowledge Base. O modelo não inventa experiências, sentimentos, opiniões ou acontecimentos pessoais. Quando a informação não está confirmada, responde naturalmente que não tem esse dado confirmado.

## Composição

- Uma janela de conversa é a experiência principal e única janela aberta por defeito.
- O núcleo energético permanece ao centro como elemento visual da identidade.
- O cabeçalho apresenta apenas a marca pessoal de Edmundo Kutuzov.
- O painel de privacidade é opcional e só abre quando o visitante o solicita.
- O antigo painel público de comandos foi retirado. O Action Engine e o adaptador de demonstração permanecem no código interno e nos testes, mas não fazem parte da experiência do visitante.
- As janelas continuam a poder ser movidas pelo cabeçalho em desktop. Em ecrãs estreitos, passam para uma composição vertical.

## Conversa

- O visitante vê uma saudação em primeira pessoa e três sugestões de conversa.
- As mensagens aparecem com identificadores simples: “VOCÊ” e “KUTUZOV”.
- Não se mostram nomes de fornecedores, rótulos técnicos, referências internas, caminhos de ficheiros, datas de snapshot ou instruções de sandbox.
- A caixa de escrita usa a expressão “Escreva-me uma mensagem...”.
- As respostas de fallback usam a mesma voz conversacional e distinguem informação confirmada de informação desconhecida.
- Os projectos relacionados aparecem em cartões discretos. Cada cartão abre directamente a página oficial do projecto, usando apenas slugs publicados e permitidos.

## Privacidade

O histórico é opcional e fica guardado no dispositivo do visitante. O painel explica que as mensagens são processadas por um serviço externo para gerar respostas. O visitante pode activar ou desactivar a gravação e apagar as conversas guardadas. Não se mostra contagem de sessões, mensagens ou estados internos.

## Arquitectura e segurança

A interface pública envia perguntas para o endpoint privado no Vercel. A chave do serviço permanece no servidor. Qwen3, WebLLM e WebGPU não são importados nem carregados pela experiência pública. Quando o serviço não está disponível, o site permite consultar informação pública confirmada através do fallback determinístico, sem fingir que houve geração por IA.

A abertura automática de projectos só usa slugs publicados na allowlist e uma rota fixa do portefólio oficial. Nenhum URL gerado pelo modelo é aceite.

## Performance e validação

A composição não introduz dependências. Os estilos dos painéis técnicos retirados foram eliminados da folha pública para manter o orçamento de CSS. Os testes Playwright cobrem a interface simples, a disponibilidade/fallback, a conversa com resposta Gemini simulada, a privacidade, a responsividade, a segurança do texto introduzido e o arrastamento das janelas.
