export type Category =
  | "Mercado" | "Restaurante" | "Transporte" | "Streaming"
  | "Saúde" | "Farmácia" | "Lazer" | "Assinaturas"
  | "Combustível" | "Educação" | "Salário" | "Investimentos" | "Outros";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: Category;
  aiCategory: Category;
  aiConfidence: number;
  isConfirmed: boolean;
  isRecurring: boolean;
  institution: string;
}

export const TRANSACTIONS: Transaction[] = [
  { id:"1",  date:"2026-05-28", description:"IFOOD*RESTAURANTE",       amount:-42.90,  type:"expense", category:"Restaurante",  aiCategory:"Restaurante",  aiConfidence:0.97, isConfirmed:true,  isRecurring:false, institution:"Nubank" },
  { id:"2",  date:"2026-05-27", description:"UBER TRIP",                amount:-18.50,  type:"expense", category:"Transporte",   aiCategory:"Transporte",   aiConfidence:0.99, isConfirmed:true,  isRecurring:false, institution:"Nubank" },
  { id:"3",  date:"2026-05-26", description:"SPOTIFY PREMIUM",          amount:-21.90,  type:"expense", category:"Streaming",    aiCategory:"Streaming",    aiConfidence:0.98, isConfirmed:true,  isRecurring:true,  institution:"Nubank" },
  { id:"4",  date:"2026-05-25", description:"SUPERMERCADO EXTRA",       amount:-312.40, type:"expense", category:"Mercado",      aiCategory:"Mercado",      aiConfidence:0.96, isConfirmed:true,  isRecurring:false, institution:"Nubank" },
  { id:"5",  date:"2026-05-24", description:"FARMACIA DROGASIL",        amount:-67.80,  type:"expense", category:"Farmácia",     aiCategory:"Farmácia",     aiConfidence:0.95, isConfirmed:true,  isRecurring:false, institution:"Nubank" },
  { id:"6",  date:"2026-05-23", description:"SHELL COMBUSTIVEL",        amount:-200.00, type:"expense", category:"Combustível",  aiCategory:"Combustível",  aiConfidence:0.91, isConfirmed:true,  isRecurring:false, institution:"Itaú"  },
  { id:"7",  date:"2026-05-22", description:"NETFLIX.COM",              amount:-55.90,  type:"expense", category:"Streaming",    aiCategory:"Streaming",    aiConfidence:0.99, isConfirmed:true,  isRecurring:true,  institution:"Nubank" },
  { id:"8",  date:"2026-05-21", description:"ACADEMIA SMART FIT",       amount:-109.90, type:"expense", category:"Saúde",        aiCategory:"Saúde",        aiConfidence:0.93, isConfirmed:true,  isRecurring:true,  institution:"Nubank" },
  { id:"9",  date:"2026-05-20", description:"AMAZON PRIME",             amount:-14.90,  type:"expense", category:"Assinaturas",  aiCategory:"Assinaturas",  aiConfidence:0.97, isConfirmed:true,  isRecurring:true,  institution:"Nubank" },
  { id:"10", date:"2026-05-19", description:"TAXA DESCONHECIDA XYZ",    amount:-29.90,  type:"expense", category:"Outros",       aiCategory:"Outros",       aiConfidence:0.62, isConfirmed:false, isRecurring:false, institution:"Itaú"  },
  { id:"11", date:"2026-05-18", description:"CURSO UDEMY",              amount:-79.90,  type:"expense", category:"Educação",     aiCategory:"Educação",     aiConfidence:0.88, isConfirmed:true,  isRecurring:false, institution:"Nubank" },
  { id:"12", date:"2026-05-17", description:"CINEMA CINEMARK",          amount:-88.00,  type:"expense", category:"Lazer",        aiCategory:"Lazer",        aiConfidence:0.94, isConfirmed:true,  isRecurring:false, institution:"Nubank" },
  { id:"13", date:"2026-05-15", description:"SALARIO EMPRESA LTDA",     amount:8500.00, type:"income",  category:"Salário",      aiCategory:"Salário",      aiConfidence:0.99, isConfirmed:true,  isRecurring:true,  institution:"Itaú"  },
  { id:"14", date:"2026-05-10", description:"NUBANK INVESTIMENTO",      amount:-500.00, type:"expense", category:"Investimentos",aiCategory:"Investimentos",aiConfidence:0.90, isConfirmed:true,  isRecurring:true,  institution:"Nubank" },
  { id:"15", date:"2026-05-08", description:"PAGUE MENOS FARMACIA",     amount:-45.20,  type:"expense", category:"Farmácia",     aiCategory:"Farmácia",     aiConfidence:0.92, isConfirmed:true,  isRecurring:false, institution:"Nubank" },
  { id:"16", date:"2026-05-05", description:"MERCADO LIVRE",            amount:-156.70, type:"expense", category:"Outros",       aiCategory:"Lazer",        aiConfidence:0.71, isConfirmed:false, isRecurring:false, institution:"Nubank" },
  { id:"17", date:"2026-05-03", description:"RESTAURANTE OUTBACK",      amount:-230.00, type:"expense", category:"Restaurante",  aiCategory:"Restaurante",  aiConfidence:0.96, isConfirmed:true,  isRecurring:false, institution:"Itaú"  },
  { id:"18", date:"2026-05-01", description:"ALUGUEL IMOVEL",           amount:-2200.00,type:"expense", category:"Outros",       aiCategory:"Outros",       aiConfidence:0.85, isConfirmed:true,  isRecurring:true,  institution:"Itaú"  },
];

export const MONTHLY_EVOLUTION = [
  { month: "Nov/25", income: 8500, expense: 3820 },
  { month: "Dez/25", income: 9200, expense: 5100 },
  { month: "Jan/26", income: 8500, expense: 4200 },
  { month: "Fev/26", income: 8500, expense: 3650 },
  { month: "Mar/26", income: 8500, expense: 4890 },
  { month: "Abr/26", income: 8500, expense: 4100 },
  { month: "Mai/26", income: 8500, expense: 3973 },
];

export const CATEGORY_SUMMARY = [
  { category: "Mercado"      as Category, total: 312.40, count: 1,  color: "#2D7D46" },
  { category: "Restaurante"  as Category, total: 272.90, count: 2,  color: "#C2410C" },
  { category: "Outros"       as Category, total: 2386.60,count: 3,  color: "#64748B" },
  { category: "Investimentos"as Category, total: 500.00, count: 1,  color: "#1E3A5F" },
  { category: "Streaming"    as Category, total: 77.80,  count: 2,  color: "#7C3AED" },
  { category: "Combustível"  as Category, total: 200.00, count: 1,  color: "#D97706" },
  { category: "Saúde"        as Category, total: 109.90, count: 1,  color: "#0891B2" },
  { category: "Farmácia"     as Category, total: 113.00, count: 2,  color: "#0D9488" },
];

export const INSIGHTS = [
  { id:1, type:"warning",  text: "Você gastou 23% mais com Restaurantes em relação a abril." },
  { id:2, type:"info",     text: "3 transações aguardam sua revisão de categoria." },
  { id:3, type:"success",  text: "Você poupou R$ 4.527 este mês — acima da média dos últimos 6 meses." },
  { id:4, type:"info",     text: "Detectamos 6 cobranças recorrentes totalizando R$ 202,60/mês." },
];

export const IMPORTS = [
  { id:"i1", filename:"extrato-nubank-maio-2026.csv",  institution:"Nubank", status:"done",       rows:18, date:"2026-05-29" },
  { id:"i2", filename:"extrato-itau-maio-2026.csv",    institution:"Itaú",   status:"done",       rows:12, date:"2026-05-28" },
  { id:"i3", filename:"extrato-nubank-abril-2026.csv", institution:"Nubank", status:"processing", rows:0,  date:"2026-05-01" },
];
