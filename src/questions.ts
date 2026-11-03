import type { FormSchema } from './schema.ts';

const CANAIS = ['Balcão / salão', 'Entrega própria', 'Retirada', 'WhatsApp', 'Cardápio online', 'iFood', 'Outros marketplaces', 'Telefone', 'Instagram'];

const USA_HOJE = [
  'Ainda uso o Gplus ToGo em paralelo',
  'Saipos: PDV / gestão',
  'Saipos: cardápio digital',
  'Saipos: app de garçom',
  'Saipos: gestão de entregas',
  'Integração com iFood',
  'Maquininha integrada',
  'Planilha / caderno',
  'Outro sistema',
];

const CARDAPIO_PROBLEMAS = [
  'Visual feio / pouco personalizável',
  'Lento ou instável',
  'Difícil de montar pizza meio a meio',
  'Bordas e adicionais complicados',
  'Cliente se perde e desiste do pedido',
  'Não aceita Pix / pagamento online direito',
  'Taxa de entrega por bairro/raio ruim',
  'Não avisa o cliente sobre o status',
  'Sem cupom / fidelidade',
  'Difícil de atualizar preços e sabores',
  'Link / domínio fraco, sem a minha marca',
  'Suporte demora a resolver',
];

const DORES = [
  { v: 'meio_a_meio', t: 'Pizza meio a meio e sabores', d: 'Montar 2 ou mais sabores, cobrar pelo maior valor, bordas e adicionais.' },
  { v: 'tamanhos', t: 'Tamanhos, bordas e preços', d: 'Preço diferente por tamanho, borda recheada, combos e promoções.' },
  { v: 'taxa_entrega', t: 'Taxa de entrega por bairro/raio', d: 'Cobrar certo, evitar erro de endereço, definir área atendida.' },
  { v: 'entregadores', t: 'Controle de entregadores', d: 'Saber quem saiu, onde está, tempo de rota e acerto de motoboy.' },
  { v: 'status_pedido', t: 'Cliente não acompanha o pedido', d: 'Ligam perguntando “cadê minha pizza?”. Falta aviso de status.' },
  { v: 'comissao', t: 'Comissão de marketplace', d: 'Taxas do iFood e afins comendo a margem; dependência de app.' },
  { v: 'whatsapp', t: 'Pedidos bagunçados no WhatsApp', d: 'Mensagem perdida, anotação manual, erro na hora de repassar à cozinha.' },
  { v: 'cozinha', t: 'Comunicação com a cozinha', d: 'Impressão, fila de produção, atraso no preparo.' },
  { v: 'tempo', t: 'Tempo de preparo e entrega', d: 'Pedidos atrasando no pico e sem previsão confiável.' },
  { v: 'estoque', t: 'Estoque e insumos', d: 'Faltou queijo/massa, desperdício, custo da pizza sem controle.' },
  { v: 'fidelidade', t: 'Fidelização e recompra', d: 'Cliente pede uma vez e some; sem cupom, cashback ou campanha.' },
  { v: 'relatorios', t: 'Relatórios e números', d: 'Não sei o que vende mais, lucro por sabor, ticket médio.' },
  { v: 'fiscal', t: 'Nota fiscal e fechamento de caixa', d: 'Emissão fiscal, conferência de caixa, diferença no fim do dia.' },
  { v: 'pagamento', t: 'Pagamento online / Pix', d: 'Cobrança na entrega, troco, conciliação, calote.' },
  { v: 'suporte', t: 'Suporte e instabilidade do sistema', d: 'Sistema cai, demora a resposta, falta alguém que resolva.' },
  { v: 'equipe', t: 'Treinar e depender da equipe', d: 'Sistema difícil para atendente novo, erro humano frequente.' },
];

const PRECISA = [
  { v: 'cardapio_pizza', t: 'Cardápio pensado para pizza', d: 'Meio a meio, bordas, tamanhos e adicionais sem gambiarra.' },
  { v: 'site_proprio', t: 'Canal de venda próprio', d: 'Vender direto, sem pagar comissão de marketplace.' },
  { v: 'rastreio', t: 'Acompanhamento do pedido pelo cliente', d: 'Avisos automáticos de “em preparo” e “saiu para entrega”.' },
  { v: 'whatsapp_auto', t: 'Atendimento automático no WhatsApp', d: 'Receber o pedido completo sem digitação manual.' },
  { v: 'entrega_rota', t: 'Gestão de entrega e motoboys', d: 'Despacho, rota, acerto e taxa por bairro.' },
  { v: 'integracao', t: 'Tudo integrado num lugar só', d: 'Pedido, caixa, cozinha e estoque conversando.' },
  { v: 'marketing', t: 'Cupons, cashback e campanhas', d: 'Trazer o cliente de volta com ofertas e disparos.' },
  { v: 'gestao', t: 'Relatórios simples de gestão', d: 'Ver faturamento, mais vendidos e lucro pelo celular.' },
  { v: 'fiscal', t: 'Fiscal e financeiro sem dor', d: 'Nota, caixa e conciliação automáticos.' },
  { v: 'suporte', t: 'Suporte rápido e humano', d: 'Alguém que responde e resolve de verdade.' },
];

/**
 * Fonte das perguntas. Ao editar este arquivo e reiniciar o servidor, uma nova versão do
 * formulário é gravada no banco. Links já gerados continuam apontando para a versão antiga.
 */
export const formSchema: FormSchema = {
  brand: 'Fratelli',
  heroTitle: 'O que trava a Fratelli hoje?',
  heroLead:
    'Queremos entender o dia a dia da operação: o que irrita, o que custa dinheiro e o que você realmente precisa. Sem resposta certa ou errada.',
  steps: [
    {
      key: 'sobre',
      title: 'Sobre a Fratelli',
      sub: 'Só o básico da operação.',
      fields: [
        { type: 'chips', name: 'pedidos', label: 'Pedidos por dia (média)', hint: 'Escolha uma faixa.', single: true, options: ['Até 30', '30 a 60', '60 a 120', '120 a 250', 'Mais de 250'] },
        { type: 'chips', name: 'canais', label: 'Por onde chegam os pedidos hoje?', hint: 'Marque todos que usa.', options: CANAIS },
      ],
    },
    {
      key: 'hoje',
      title: 'Como é hoje',
      sub: 'Você saiu do Gplus ToGo e hoje usa o Saipos. Queremos saber o que funciona e, principalmente, o que não funciona no cardápio digital.',
      fields: [
        { type: 'chips', name: 'usaHoje', label: 'O que você usa no dia a dia?', options: USA_HOJE },
        { type: 'scale', name: 'nota', label: 'De 0 a 10, o quanto o sistema atual (como um todo) resolve a sua operação?', min: 0, max: 10, low: 'Não resolve', high: 'Resolve tudo' },
        { type: 'scale', name: 'notaCardapio', label: 'E só o cardápio digital do Saipos? De 0 a 10, o quanto você gosta dele?', min: 0, max: 10, low: 'Não gosto', high: 'Adoro' },
        { type: 'select', name: 'comparaGplus', label: 'Comparado ao Gplus ToGo que você usava antes, o cardápio do Saipos é…', options: ['Muito pior', 'Um pouco pior', 'Parecido', 'Um pouco melhor', 'Muito melhor', 'Não cheguei a usar o Gplus ToGo'] },
        { type: 'area', name: 'gplusSaudade', label: 'O que o Gplus ToGo fazia melhor e você sente falta?', placeholder: 'Ex.: montar meio a meio era mais simples, visual mais bonito…' },
        { type: 'area', name: 'motivoMigracao', label: 'Por que decidiram sair do Gplus e ir para o Saipos?', placeholder: 'Ex.: preço, PDV, integração com iFood, suporte…' },
        { type: 'chips', name: 'cardapioProblemas', label: 'O que não funciona no cardápio digital atual?', hint: 'Marque tudo que te incomoda.', options: CARDAPIO_PROBLEMAS },
        { type: 'select', name: 'cardapioVendas', label: 'Quanto das vendas vem pelo cardápio digital hoje?', options: ['Quase nada', 'Até 20%', '20% a 50%', 'Mais de 50%'] },
        { type: 'area', name: 'cardapioHistoria', label: 'Conte o que mais te frustra no cardápio digital deles', placeholder: 'Ex.: o cliente desiste na hora de escolher meio a meio e pede pelo WhatsApp…' },
        { type: 'area', name: 'gosta', label: 'O que no sistema funciona bem e você não quer perder?', placeholder: 'Ex.: PDV, impressão na cozinha, integração com iFood…' },
        { type: 'area', name: 'incomoda', label: 'Fora o cardápio, o que mais te irrita ou te faz perder tempo?', placeholder: 'Conte do jeito que fala com a equipe. Quanto mais real, melhor.' },
      ],
    },
    {
      key: 'dores',
      title: 'Suas maiores dores',
      sub: 'Marque tudo que acontece na sua pizzaria. Depois escolhemos o que mais pesa.',
      fields: [
        { type: 'cards', name: 'dores', label: 'Quais dessas dores acontecem na Fratelli?', hint: 'Marque quantas quiser.', required: true, options: DORES, rank: { name: 'doresTop', label: 'As 3 que mais machucam', max: 3 } },
        {
          type: 'pair',
          fields: [
            { type: 'select', name: 'frequencia', label: 'Com que frequência esses problemas aparecem?', options: ['Todo dia', 'Várias vezes por semana', 'Semanalmente', 'De vez em quando'] },
            { type: 'select', name: 'perda', label: 'Quanto isso custa por mês (estimativa)?', options: ['Não sei', 'Até R$ 500', 'R$ 500 a R$ 2.000', 'R$ 2.000 a R$ 5.000', 'Mais de R$ 5.000'] },
          ],
        },
        { type: 'area', name: 'dorHistoria', label: 'Conte um episódio recente que te fez pensar “isso não pode continuar”', placeholder: 'Ex.: sexta à noite, 3 pedidos perdidos no WhatsApp…' },
      ],
    },
    {
      key: 'precisa',
      title: 'O que você precisa de verdade',
      sub: 'Esqueça funções bonitas. O que faria diferença no caixa e na sua rotina?',
      fields: [
        { type: 'cards', name: 'precisa', label: 'O que seria essencial para a Fratelli?', hint: 'Marque tudo que faria diferença.', required: true, options: PRECISA, rank: { name: 'precisaTop', label: 'O mais importante, em ordem', max: 6 } },
        { type: 'area', name: 'mudaria', label: 'Se pudesse mudar uma única coisa amanhã, o que seria?', placeholder: 'Uma frase já basta.' },
        { type: 'area', name: 'naoAceita', label: 'Algo que um novo sistema NÃO pode ter?', placeholder: 'Ex.: ser complicado, exigir contrato longo, trocar de maquininha…' },
      ],
    },
    {
      key: 'decisao',
      title: 'Para fechar',
      sub: 'Só para alinharmos expectativa. Nada aqui é compromisso.',
      fields: [
        {
          type: 'pair',
          fields: [
            { type: 'select', name: 'urgencia', label: 'Qual a urgência?', options: ['Preciso resolver já', 'Nos próximos 3 meses', 'Estou só pesquisando'] },
            { type: 'select', name: 'investimento', label: 'Quanto pensa em investir por mês?', options: ['Até R$ 200', 'R$ 200 a R$ 500', 'R$ 500 a R$ 1.000', 'Depende do resultado'] },
          ],
        },
        { type: 'select', name: 'decisor', label: 'Quem decide a troca?', options: ['Eu mesmo(a)', 'Eu e sócio(a)', 'Outra pessoa'] },
        { type: 'select', name: 'contato', label: 'Melhor jeito de falar com você', options: ['WhatsApp', 'Ligação', 'E-mail', 'Videochamada'] },
        { type: 'area', name: 'extra', label: 'Mais alguma coisa que devemos saber?', placeholder: 'Opcional.' },
      ],
    },
  ],
};
