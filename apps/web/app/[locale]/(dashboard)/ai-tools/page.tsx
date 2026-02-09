'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Bot,
  FileText,
  Sparkles,
  MessageSquare,
  Wand2,
  Copy,
  Download,
  Layers,
  Send,
  Upload,
  X,
  Loader2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import {
  aiSummarize,
  aiFlashcards,
  aiChat,
  type SummaryResult,
  type Flashcard,
  type ChatMessageParam,
} from '@/lib/api-client';

// ── File Picker Zone ──────────────────────────────────────

function FilePicker({
  file,
  onFileChange,
  onClear,
  accept = '.pdf,.txt,.md,.doc,.docx',
}: {
  file: File | null;
  onFileChange: (f: File) => void;
  onClear: () => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) onFileChange(f);
    },
    [onFileChange],
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => !file && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
        file
          ? 'border-primary/40 bg-primary/5'
          : 'border-border hover:border-primary/40 cursor-pointer'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChange(f);
        }}
        className="hidden"
      />
      {file ? (
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <FileText className="size-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-primary/10 p-4 w-fit mx-auto mb-3">
            <Upload className="size-8 text-primary" />
          </div>
          <p className="font-medium">Chọn tài liệu để phân tích</p>
          <p className="text-sm text-muted-foreground mt-1">
            Kéo thả file PDF, TXT, DOCX hoặc nhấp để chọn
          </p>
        </>
      )}
    </div>
  );
}

// ── Summary Tab ──────────────────────────────────────────

function SummaryTab() {
  const [file, setFile] = useState<File | null>(null);
  const [length, setLength] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState('');

  const handleSummarize = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await aiSummarize(file, length);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Tóm tắt thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `${result.summary}\n\nĐiểm chính:\n${result.keyPoints.map((p) => `• ${p}`).join('\n')}`;
    navigator.clipboard.writeText(text);
  };

  const handleDownload = () => {
    if (!result) return;
    const text = `# Tóm tắt: ${result.source}\n\n${result.summary}\n\n## Điểm chính\n${result.keyPoints.map((p) => `- ${p}`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${result.source}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wand2 className="size-4 text-primary" />
          Tóm tắt nhanh tài liệu
        </CardTitle>
        <CardDescription>
          Chọn tài liệu và AI sẽ tóm tắt nội dung cho bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FilePicker
          file={file}
          onFileChange={setFile}
          onClear={() => {
            setFile(null);
            setResult(null);
          }}
        />

        <div>
          <p className="text-sm font-medium mb-2">Độ dài tóm tắt</p>
          <div className="flex gap-2">
            {(['short', 'medium', 'detailed'] as const).map((l) => (
              <Button
                key={l}
                variant={length === l ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setLength(l)}
              >
                {l === 'short' ? 'Ngắn gọn' : l === 'medium' ? 'Trung bình' : 'Chi tiết'}
              </Button>
            ))}
          </div>
        </div>

        <Button
          variant="lime"
          className="w-full gap-2"
          disabled={!file || loading}
          onClick={handleSummarize}
        >
          {loading ? (
            <><Loader2 className="size-4 animate-spin" /> Đang tóm tắt...</>
          ) : (
            <><Sparkles className="size-4" /> Tạo tóm tắt</>
          )}
        </Button>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {result && (
          <Card className="bg-muted/30 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="lime" className="text-[10px]">AI Summary</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Sao chép">
                    <Copy className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} title="Tải xuống">
                    <Download className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-sm space-y-3">
                <p className="leading-relaxed">{result.summary}</p>
                {result.keyPoints.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground mb-1.5">Điểm chính:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {result.keyPoints.map((point, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="text-primary font-bold mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-primary text-xs mt-2">Nguồn: {result.source}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

// ── Flashcard Tab ────────────────────────────────────────

function FlashcardTab() {
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setFlashcards([]);
    try {
      const res = await aiFlashcards(file, count);
      setFlashcards(res.flashcards);
      setCurrentIndex(0);
      setFlipped(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Tạo flashcard thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (flashcards.length === 0) return;
    const tsv = flashcards.map((c) => `${c.front}\t${c.back}`).join('\n');
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards.tsv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          Flashcard Generator
        </CardTitle>
        <CardDescription>
          Tạo flashcard tự động từ nội dung tài liệu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FilePicker
          file={file}
          onFileChange={setFile}
          onClear={() => {
            setFile(null);
            setFlashcards([]);
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            placeholder="Số flashcard"
          />
          <Button
            variant="lime"
            className="gap-2"
            disabled={!file || loading}
            onClick={handleGenerate}
          >
            {loading ? (
              <><Loader2 className="size-4 animate-spin" /> Đang tạo...</>
            ) : (
              <><Sparkles className="size-4" /> Tạo Flashcard</>
            )}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {flashcards.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {flashcards.length} flashcard đã tạo
              </span>
              <div className="flex gap-1">
                <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
                  Lưới
                </Button>
                <Button variant={viewMode === 'single' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('single')}>
                  Từng thẻ
                </Button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-100 overflow-y-auto pr-1">
                {flashcards.map((card, i) => (
                  <Card key={i} className="group hover:border-primary/30 transition-all">
                    <CardContent className="p-4">
                      <Badge variant="lime" className="text-[10px] mb-2">#{i + 1}</Badge>
                      <p className="text-sm font-medium">{card.front}</p>
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">{card.back}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <Card
                  className="min-h-50 flex items-center justify-center cursor-pointer hover:border-primary/30 transition-all"
                  onClick={() => setFlipped(!flipped)}
                >
                  <CardContent className="p-6 text-center">
                    <Badge variant={flipped ? 'outline' : 'lime'} className="text-[10px] mb-3">
                      {flipped ? 'Trả lời' : 'Câu hỏi'} - {currentIndex + 1}/{flashcards.length}
                    </Badge>
                    <p className={`text-base ${flipped ? 'text-muted-foreground' : 'font-medium'}`}>
                      {flipped ? flashcards[currentIndex]?.back : flashcards[currentIndex]?.front}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-3">
                      Nhấp để {flipped ? 'xem câu hỏi' : 'xem trả lời'}
                    </p>
                  </CardContent>
                </Card>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="icon" disabled={currentIndex === 0} onClick={() => { setCurrentIndex((i) => i - 1); setFlipped(false); }}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-15 text-center">
                    {currentIndex + 1} / {flashcards.length}
                  </span>
                  <Button variant="outline" size="icon" disabled={currentIndex === flashcards.length - 1} onClick={() => { setCurrentIndex((i) => i + 1); setFlipped(false); }}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full gap-2" onClick={handleExport}>
              <Download className="size-4" /> Xuất Flashcard (.tsv)
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Chat Tab ─────────────────────────────────────────────

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

function ChatTab() {
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (f: File) => {
    setFile(f);
    setMessages([
      {
        role: 'assistant',
        content: `Đã tải tài liệu "${f.name}" (${formatFileSize(f.size)}). Hãy đặt câu hỏi về nội dung tài liệu!`,
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !file) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const history: ChatMessageParam[] = messages
        .filter((_, idx) => idx > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await aiChat({
        file,
        message: userMsg,
        history,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Lỗi: ${err instanceof Error ? err.message : 'Không thể trả lời'}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <Card className="h-162.5 flex flex-col">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          Chat with Document
        </CardTitle>
        <CardDescription>Hỏi đáp trực tiếp dựa trên nội dung tài liệu</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {!file && (
          <div className="p-4">
            <FilePicker file={file} onFileChange={handleFileSelect} onClear={() => { setFile(null); setMessages([]); }} />
          </div>
        )}

        {file && (
          <div className="px-4 pt-3 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <FileText className="size-3.5 text-primary" />
              <span className="text-xs truncate">{file.name}</span>
              <span className="text-[10px] text-muted-foreground">({formatFileSize(file.size)})</span>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => { setFile(null); setMessages([]); }}>
              <RotateCcw className="size-3" /> Đổi tài liệu
            </Button>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.length === 0 && !file && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="size-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Chọn tài liệu để bắt đầu hỏi đáp</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="size-4 text-primary" />
                </div>
              )}
              <div className={`rounded-xl px-4 py-3 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="rounded-xl bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Đang suy nghĩ...
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={file ? 'Đặt câu hỏi về tài liệu...' : 'Chọn tài liệu trước...'}
              className="flex-1"
              disabled={!file || loading}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <Button variant="lime" size="icon" disabled={!file || !input.trim() || loading} onClick={handleSend}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function AIToolsPage() {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Productivity Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tận dụng AI để tóm tắt, tạo flashcard và hỏi đáp trên tài liệu
        </p>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary" className="gap-1.5">
            <Wand2 className="size-3.5" /> Tóm tắt
          </TabsTrigger>
          <TabsTrigger value="flashcard" className="gap-1.5">
            <Layers className="size-3.5" /> Flashcard
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5">
            <MessageSquare className="size-3.5" /> Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          <SummaryTab />
        </TabsContent>

        <TabsContent value="flashcard" className="mt-4 space-y-4">
          <FlashcardTab />
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <ChatTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
