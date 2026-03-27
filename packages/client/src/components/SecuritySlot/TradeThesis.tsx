import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../../services/api';

interface TradeThesisProps {
  slotId: number;
  ticker: string;
}

export function TradeThesis({ slotId, ticker }: TradeThesisProps) {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!ticker) return;
    api.notes.get(slotId, ticker).then((note) => {
      setContent(note?.content || '');
      setSaved(true);
    }).catch(() => {});
  }, [slotId, ticker]);

  const debouncedSave = useCallback((text: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaved(false);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await api.notes.save(slotId, ticker, text);
        setSaved(true);
      } catch (err) {
        console.error('Failed to save note:', err);
      }
    }, 800);
  }, [slotId, ticker]);

  const handleChange = (value: string) => {
    setContent(value);
    debouncedSave(value);
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  return (
    <div className="flex flex-col h-full min-h-[80px] max-h-[200px]">
      <div
        className="flex items-center justify-between px-2 h-6 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setIsEditing(!isEditing)}
        aria-expanded={isEditing}
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold tracking-widest text-muted-foreground">TRADE THESIS // ACTIVE</span>
          {!saved && (
            <span className="text-[8px] font-mono text-primary animate-pulse">SAVING...</span>
          )}
        </div>
        <span className="material-symbols-outlined !text-xs text-muted-foreground">
          {isEditing ? 'keyboard_arrow_up' : 'expand_more'}
        </span>
      </div>

      <div className="p-3 text-[11px] leading-relaxed text-muted-foreground border-t border-border/30 flex-1 overflow-y-auto bg-background">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write your trade thesis in markdown…&#10;&#10;## Bull Case&#10;- Strong revenue growth&#10;- Expanding margins"
            className="w-full h-full min-h-[60px] resize-none outline-none bg-transparent font-mono text-foreground"
          />
        ) : content ? (
          <div className="markdown-body opacity-80">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="italic opacity-80 cursor-pointer" onClick={() => setIsEditing(true)}>
            Click header to write your trade thesis...
          </p>
        )}
      </div>
    </div>
  );
}
