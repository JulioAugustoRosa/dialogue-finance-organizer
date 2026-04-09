import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatBRL, calculateIR } from "@/lib/tax-calculator";
import {
  BarChart3, Bot, LogOut, Plus, Trash2, TrendingUp, TrendingDown,
  Calendar, DollarSign, Target, Receipt,
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  category_id: string | null;
};

type Period = "month" | "lastMonth" | "3months" | "year" | "custom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTx, setNewTx] = useState({ description: "", amount: "", type: "despesa", date: format(new Date(), "yyyy-MM-dd") });

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate("/auth"); return; }
      fetchTransactions();
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
    });
    checkAuth();
    return () => subscription.unsubscribe();
  }, [navigate, period, customStart, customEnd]);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case "month": return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
      case "lastMonth": { const lm = subMonths(now, 1); return { start: format(startOfMonth(lm), "yyyy-MM-dd"), end: format(endOfMonth(lm), "yyyy-MM-dd") }; }
      case "3months": return { start: format(subMonths(now, 3), "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
      case "year": return { start: format(new Date(now.getFullYear(), 0, 1), "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
      case "custom": return { start: customStart || format(subDays(now, 30), "yyyy-MM-dd"), end: customEnd || format(now, "yyyy-MM-dd") };
    }
  };

  const fetchTransactions = async () => {
    const { start, end } = getDateRange();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });
    if (error) toast.error("Erro ao carregar transações");
    else setTransactions(data || []);
    setLoading(false);
  };

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("transactions").insert({
      description: newTx.description,
      amount: parseFloat(newTx.amount),
      type: newTx.type,
      date: newTx.date,
      user_id: session.user.id,
    });
    if (error) toast.error("Erro ao adicionar");
    else {
      toast.success("Transação adicionada!");
      setNewTx({ description: "", amount: "", type: "despesa", date: format(new Date(), "yyyy-MM-dd") });
      setShowAddForm(false);
      fetchTransactions();
    }
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluída!"); fetchTransactions(); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const income = transactions.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;
  const taxInfo = calculateIR(income);

  const periodLabels: Record<Period, string> = {
    month: "Este mês",
    lastMonth: "Mês passado",
    "3months": "3 meses",
    year: "Este ano",
    custom: "Personalizado",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <span className="text-lg font-bold text-primary">FinançasAI</span>
          <div className="flex items-center gap-2">
            <Link to="/chat" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Bot className="w-4 h-4" /> Chat IA
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Period filter */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
          {period === "custom" && (
            <div className="flex gap-2 ml-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-2 py-1 rounded border border-input bg-background text-foreground text-sm" />
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-2 py-1 rounded border border-input bg-background text-foreground text-sm" />
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} label="Receitas" value={formatBRL(income)} color="text-emerald-500" />
          <Card icon={<TrendingDown className="w-5 h-5 text-red-500" />} label="Despesas" value={formatBRL(expenses)} color="text-red-500" />
          <Card icon={<DollarSign className="w-5 h-5 text-primary" />} label="Saldo" value={formatBRL(balance)} color={balance >= 0 ? "text-emerald-500" : "text-red-500"} />
          <Card icon={<Receipt className="w-5 h-5 text-amber-500" />} label="IR Estimado" value={taxInfo.tax === 0 ? "Isento" : formatBRL(taxInfo.tax)} color="text-amber-500" />
        </div>

        {/* Transactions */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-card-foreground">Transações</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={addTransaction} className="p-4 border-b border-border bg-muted/50 grid grid-cols-1 md:grid-cols-5 gap-3">
              <input placeholder="Descrição" value={newTx.description} onChange={(e) => setNewTx({ ...newTx, description: e.target.value })} required className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm" />
              <input type="number" step="0.01" min="0.01" placeholder="Valor" value={newTx.amount} onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} required className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm" />
              <select value={newTx.type} onChange={(e) => setNewTx({ ...newTx, type: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm">
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
              <input type="date" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm" />
              <button type="submit" className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Salvar</button>
            </form>
          )}

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhuma transação neste período.</div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${t.type === "receita" ? "bg-emerald-500" : "bg-red-500"}`} />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(t.date), "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${t.type === "receita" ? "text-emerald-500" : "text-red-500"}`}>
                      {t.type === "receita" ? "+" : "-"} {formatBRL(t.amount)}
                    </span>
                    <button onClick={() => deleteTransaction(t.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
