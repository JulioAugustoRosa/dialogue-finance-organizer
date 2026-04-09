import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Bot, Shield, Target, TrendingUp, Wallet } from "lucide-react";

const features = [
  { icon: Bot, title: "IA Financeira", desc: "Converse com a IA para registrar gastos, tirar dúvidas e receber conselhos." },
  { icon: BarChart3, title: "Dashboard Completo", desc: "Visualize receitas, despesas e evolução em gráficos interativos." },
  { icon: Target, title: "Metas Financeiras", desc: "Defina objetivos e acompanhe seu progresso mês a mês." },
  { icon: Shield, title: "IR 2026 Atualizado", desc: "Cálculo automático do imposto com a nova faixa de isenção até R$ 5.000." },
  { icon: Wallet, title: "Controle de Dívidas", desc: "Gerencie parcelas, juros e progresso de quitação." },
  { icon: TrendingUp, title: "Relatórios por Período", desc: "Filtre por mês, trimestre, ano ou datas personalizadas." },
];

const steps = [
  { n: "01", title: "Crie sua conta", desc: "Cadastro rápido e seguro com verificação de e-mail." },
  { n: "02", title: "Registre suas finanças", desc: "Adicione receitas e despesas manualmente ou via chat com IA." },
  { n: "03", title: "Acompanhe e cresça", desc: "Visualize relatórios, atinja metas e controle o IR." },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <span className="text-xl font-bold text-primary">FinançasAI</span>
          <div className="flex gap-3">
            <Link to="/auth" className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
              Entrar
            </Link>
            <Link to="/auth?tab=signup" className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Criar conta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            🇧🇷 IR 2026 — Isenção até R$ 5.000
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight mb-6">
            Suas finanças no <span className="text-primary">controle total</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Gerencie receitas, despesas, metas e impostos com inteligência artificial. Simples, seguro e 100% brasileiro.
          </p>
          <Link
            to="/auth?tab=signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
          >
            Começar grátis <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Tudo que você precisa</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow">
                <f.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-card-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Como funciona</h2>
          <div className="space-y-8">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {s.n}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{s.title}</h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">Pronto para organizar suas finanças?</h2>
          <p className="text-primary-foreground/80 mb-8">Crie sua conta e comece a usar agora mesmo.</p>
          <Link
            to="/auth?tab=signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-background text-foreground font-semibold text-lg hover:bg-background/90 transition-all"
          >
            Criar conta grátis <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FinançasAI. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
