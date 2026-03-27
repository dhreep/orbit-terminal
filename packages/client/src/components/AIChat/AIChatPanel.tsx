import { useState, useRef, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useVault } from '@/components/Vault/VaultProvider';
import type { ChatMessage, AIProvider } from '@orbit/shared';

const SYSTEM_PROMPT = 'You are a financial analyst assistant. Help the user analyze stocks, interpret market data, and make informed decisions.';

async function sendToGroq(messages: ChatMessage[], apiKey: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
    }),
  });
  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function sendToOllama(messages: ChatMessage[]): Promise<string> {
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.1',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.message.content;
}

interface AIChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIChatPanel({ open, onOpenChange }: AIChatPanelProps) {
  const vault = useVault();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<AIProvider>('groq');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date().toISOString() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      let reply: string;
      if (provider === 'groq') {
        const key = vault.getApiKey('groq');
        if (!key) throw new Error('Groq API key not found. Add it via API Key Manager.');
        reply = await sendToGroq(updated, key);
      } else {
        reply = await sendToOllama(updated);
      }
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: reply, timestamp: new Date().toISOString() }]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, provider, vault]);

  const hasKey = provider === 'ollama' || !!vault.getApiKey('groq');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-96 p-0 flex flex-col bg-popover">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-bold uppercase tracking-widest">AI Chat</SheetTitle>
            <Select value={provider} onValueChange={(v) => setProvider(v as AIProvider)}>
              <SelectTrigger size="sm" className="w-24" aria-label="Select AI provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groq">Groq</SelectItem>
                <SelectItem value="ollama">Ollama</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SheetDescription className="text-xs">Financial analyst assistant</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-3 py-2">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-xs py-12">Ask about stocks, market data, or portfolio analysis.</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary/20 text-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start mb-3">
              <div className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground animate-pulse">Thinking…</div>
            </div>
          )}
          {error && (
            <div className="mb-3 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
          )}
          <div ref={bottomRef} />
        </ScrollArea>

        <div className="p-3 border-t border-border/30">
          {!hasKey && (
            <Badge variant="destructive" className="mb-2 text-[10px]">
              No {provider} API key — add via Key Manager
            </Badge>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a stock…"
              className="flex-1 h-8 text-xs"
              disabled={loading}
              aria-label="Chat message input"
            />
            <Button size="sm" type="submit" disabled={loading || !input.trim()}>
              <span className="material-symbols-outlined !text-sm">send</span>
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
