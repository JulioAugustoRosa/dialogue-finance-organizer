import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Bot, Plus, Send, Trash2, MessageSquare, User } from "lucide-react";

type Message = { id: string; role: string; content: string; conversation_id: string | null };
type Conversation = { id: string; title: string; created_at: string | null };

export default function Chat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate("/auth"); return; }
      setUserId(data.session.user.id);
      fetchConversations(data.session.user.id);
    };
    init();
  }, [navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async (uid: string) => {
    const { data } = await supabase.from("conversations").select("*").eq("user_id", uid).order("updated_at", { ascending: false });
    setConversations(data || []);
    if (data && data.length > 0 && !activeConvId) {
      setActiveConvId(data[0].id);
      fetchMessages(data[0].id);
    }
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase.from("chat_messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const createConversation = async () => {
    if (!userId) return;
    const { data, error } = await supabase.from("conversations").insert({ user_id: userId, title: "Nova conversa" }).select().single();
    if (error) { toast.error("Erro ao criar conversa"); return; }
    setConversations((prev) => [data, ...prev]);
    setActiveConvId(data.id);
    setMessages([]);
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("conversation_id", id);
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  const selectConversation = (id: string) => {
    setActiveConvId(id);
    fetchMessages(id);
  };

  const processFinancialActions = async (text: string) => {
    const regex = /```json:action\s*([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      try {
        const action = JSON.parse(match[1]);
        if (!userId) continue;
        if (action.type === "create_transaction") {
          await supabase.from("transactions").insert({
            description: action.description,
            amount: action.amount,
            type: action.transaction_type || "despesa",
            date: action.date || new Date().toISOString().split("T")[0],
            user_id: userId,
          });
          toast.success(`Transação "${action.description}" registrada!`);
        } else if (action.type === "delete_transaction") {
          await supabase.from("transactions").delete().eq("id", action.id).eq("user_id", userId);
          toast.success("Transação removida!");
        }
      } catch {}
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !userId) return;
    let convId = activeConvId;

    if (!convId) {
      const { data } = await supabase.from("conversations").insert({ user_id: userId, title: input.slice(0, 50) }).select().single();
      if (!data) return;
      convId = data.id;
      setActiveConvId(convId);
      setConversations((prev) => [data, ...prev]);
    }

    // Update title if first message
    if (messages.length === 0) {
      await supabase.from("conversations").update({ title: input.slice(0, 50) }).eq("id", convId);
      setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title: input.slice(0, 50) } : c)));
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input, conversation_id: convId };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Save user message
    await supabase.from("chat_messages").insert({ content: userMsg.content, role: "user", user_id: userId, conversation_id: convId });

    // Call edge function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message: input, conversationId: convId }),
      });

      if (!res.ok) throw new Error("Erro na resposta da IA");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      const assistantMsgId = crypto.randomUUID();
      const assistantMsg: Message = { id: assistantMsgId, role: "assistant", content: "", conversation_id: convId };
      setMessages((prev) => [...prev, assistantMsg]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: fullResponse } : m)));
        }
      }

      // Save assistant message
      await supabase.from("chat_messages").insert({ content: fullResponse, role: "assistant", user_id: userId, conversation_id: convId });

      // Process financial actions
      await processFinancialActions(fullResponse);
    } catch (err) {
      toast.error("Erro ao comunicar com a IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border flex flex-col bg-card hidden md:flex">
        <div className="p-3 border-b border-border">
          <button onClick={createConversation} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Nova conversa
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors group ${
                activeConvId === c.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{c.title}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border">
          <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-2 p-3 border-b border-border">
          <Link to="/dashboard" className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <span className="font-semibold text-foreground text-sm">Chat IA</span>
          <button onClick={createConversation} className="ml-auto text-primary"><Plus className="w-5 h-5" /></button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="w-12 h-12 mb-4 text-primary/30" />
              <p className="text-lg font-medium">Olá! Sou sua IA financeira.</p>
              <p className="text-sm mt-1">Diga algo como "Gastei R$ 200 no mercado" e eu registro para você.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}>
                {m.content.replace(/```json:action[\s\S]*?```/g, "").trim() || m.content}
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="bg-muted rounded-xl px-4 py-2.5 text-sm text-muted-foreground">Pensando...</div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
