import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';
import { 
  Sparkles, 
  Settings, 
  Activity, 
  Database, 
  Cpu, 
  Clock, 
  DollarSign, 
  Zap,
  ChevronRight,
  Command,
  Search,
  Plus,
  Trash2,
  Share2,
  Moon,
  Sun,
  Monitor,
  Code,
  Image as ImageIcon,
  Mic,
  Volume2,
  Send,
  Paperclip,
  MoreVertical,
  User,
  Bot,
  History,
  LayoutDashboard,
  Menu,
  X,
  ChevronLeft,
  FileText,
  Globe,
  MessageSquare,
  Layers,
  Terminal,
  Copy,
  RefreshCw,
  Play,
  Save,
  Download
} from 'lucide-react';
import { aiService } from '@/src/lib/ai-service';
import { Message, ModelInfo, SessionMetrics } from '@/src/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentModel, setCurrentModel] = useState<ModelInfo>(aiService.getModels()[0]);
  const [metrics, setMetrics] = useState<SessionMetrics>({
    duration: 0,
    tokensPerSecond: 0,
    totalTokens: 0,
    totalCost: 0,
    requestCount: 0
  });
  const [showSettings, setShowSettings] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [code, setCode] = useState('// Welcome to Vibe Code\n// Start coding here...\n\nfunction helloAura() {\n  console.log("Hello from Aura Agent!");\n}\n\nhelloAura();');
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const [isListening, setIsListening] = useState(false);
  const [vibePrompt, setVibePrompt] = useState('');
  const [isVibing, setIsVibing] = useState(false);
  const [vibeStep, setVibeStep] = useState('');
  const [teamModels, setTeamModels] = useState<string[]>(['gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-3.1-pro-preview']);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleVibeCode = async () => {
    if (!vibePrompt.trim() || isVibing) return;
    
    setIsVibing(true);
    try {
      const finalCode = await aiService.vibeCode(
        vibePrompt,
        teamModels,
        (step, content) => {
          setVibeStep(step);
          if (step === 'Developing' || step === 'Completed') {
            setCode(content);
          }
        }
      );
      setCode(finalCode);
      setVibePrompt('');
    } catch (error) {
      console.error("Vibe Coding Error:", error);
    } finally {
      setIsVibing(false);
      setVibeStep('');
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      
      // Settings: Cmd/Ctrl + ,
      if (isMod && e.key === ',') {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }
      
      // Toggle Sidebar: Cmd/Ctrl + B
      if (isMod && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }

      // Focus Input: Cmd/Ctrl + K
      if (isMod && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Tabs: Alt + 1-6
      if (e.altKey && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const tabs = ['chat', 'dashboard', 'history', 'docs', 'web', 'vibecode'];
        setActiveTab(tabs[parseInt(e.key) - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, assistantMessage]);

    if (input.startsWith('/image ')) {
      try {
        const prompt = input.replace('/image ', '');
        const imageUrl = await aiService.generateImage(prompt);
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId ? { ...m, content: `![Generated Image](${imageUrl})` } : m
        ));
      } catch (error) {
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId ? { ...m, content: "Error generating image: " + (error as Error).message } : m
        ));
      } finally {
        setIsTyping(false);
      }
      return;
    }

    let fullContent = '';
    const startTime = Date.now();
    let tokenCount = 0;

    try {
      await aiService.chatStream(
        [...messages, userMessage],
        currentModel.id,
        (chunk) => {
          fullContent += chunk;
          tokenCount += chunk.split(/\s+/).length;
          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId ? { ...m, content: fullContent } : m
          ));
          
          const elapsed = (Date.now() - startTime) / 1000;
          setMetrics(prev => ({
            ...prev,
            tokensPerSecond: Math.round(tokenCount / elapsed),
            totalTokens: prev.totalTokens + 1,
            requestCount: prev.requestCount + (fullContent.length === chunk.length ? 1 : 0)
          }));
        }
      );

      if (autoSpeak) {
        handleSpeak(fullContent);
      }
    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId ? { ...m, content: "Error: " + (error as Error).message } : m
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpeak = async (text: string) => {
    try {
      const audioUrl = await aiService.generateSpeech(text);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error("Speech error:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary/10">
        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
          className="border-r border-border flex flex-col bg-card relative z-20"
        >
          <div className="p-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="p-1.5 bg-primary rounded-lg shrink-0">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-bold text-base tracking-tight truncate">aura agent</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 flat-scrollbar">
            <div className="p-3 space-y-6">
              <div className="space-y-1">
                <SidebarItem 
                  icon={<MessageSquare className="w-4 h-4" />} 
                  label="Chat" 
                  active={activeTab === 'chat'} 
                  onClick={() => setActiveTab('chat')}
                />
                <SidebarItem 
                  icon={<LayoutDashboard className="w-4 h-4" />} 
                  label="Dashboard" 
                  active={activeTab === 'dashboard'} 
                  onClick={() => setActiveTab('dashboard')}
                />
                <SidebarItem 
                  icon={<History className="w-4 h-4" />} 
                  label="History" 
                  active={activeTab === 'history'} 
                  onClick={() => setActiveTab('history')}
                />
                <SidebarItem 
                  icon={<FileText className="w-4 h-4" />} 
                  label="Documents" 
                  active={activeTab === 'docs'} 
                  onClick={() => setActiveTab('docs')}
                />
                <SidebarItem 
                  icon={<Globe className="w-4 h-4" />} 
                  label="Web Search" 
                  active={activeTab === 'web'} 
                  onClick={() => setActiveTab('web')}
                />
                <SidebarItem 
                  icon={<Code className="w-4 h-4" />} 
                  label="Vibe Code" 
                  active={activeTab === 'vibecode'} 
                  onClick={() => setActiveTab('vibecode')}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Models</p>
                <div className="space-y-1">
                  {aiService.getModels().map(model => (
                    <button
                      key={model.id}
                      onClick={() => setCurrentModel(model)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group",
                        currentModel.id === model.id 
                          ? "bg-secondary text-foreground font-medium" 
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      <span className="truncate">{model.name}</span>
                      {currentModel.id === model.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Metrics</p>
                <div className="grid grid-cols-1 gap-1 px-1">
                  <MetricRow label="Speed" value={`${metrics.tokensPerSecond} t/s`} />
                  <MetricRow label="Tokens" value={metrics.totalTokens.toLocaleString()} />
                  <MetricRow label="Requests" value={metrics.requestCount.toString()} />
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border space-y-2">
            <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
              <Button 
                variant={isDarkMode ? "ghost" : "secondary"} 
                size="sm" 
                className="flex-1 h-8 rounded-md"
                onClick={() => setIsDarkMode(false)}
              >
                <Sun className="w-3.5 h-3.5 mr-2" /> Light
              </Button>
              <Button 
                variant={isDarkMode ? "secondary" : "ghost"} 
                size="sm" 
                className="flex-1 h-8 rounded-md"
                onClick={() => setIsDarkMode(true)}
              >
                <Moon className="w-3.5 h-3.5 mr-2" /> Dark
              </Button>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-10 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-background relative">
          {/* Header */}
          <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                  <Menu className="w-4 h-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{currentModel.name}</span>
                <Badge variant="secondary" className="text-[10px] font-normal px-1.5 h-5">
                  {currentModel.provider}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={() => setMessages([])}
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Search className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Share2 className="w-4 h-4" />
              </Button>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 relative overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsContent value="chat" className="flex-1 m-0 flex flex-col overflow-hidden">
                <ScrollArea ref={scrollRef} className="flex-1 flat-scrollbar">
                  <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-8">
                    {messages.length === 0 && (
                      <div className="py-20 flex flex-col items-center text-center space-y-6">
                        <div className="p-4 bg-primary/5 rounded-full">
                          <Sparkles className="w-12 h-12 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold tracking-tight">How can I help you?</h2>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto">
                            Aura Agent is a flat, modern AI assistant. Ask questions, generate images, or analyze data.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl pt-4">
                          <FlatFeatureCard icon={<ImageIcon className="w-4 h-4" />} title="Generate Image" desc="Try '/image a minimalist workspace'" />
                          <FlatFeatureCard icon={<Code className="w-4 h-4" />} title="Code Review" desc="Paste code for instant feedback" />
                          <FlatFeatureCard icon={<Globe className="w-4 h-4" />} title="Web Search" desc="Get real-time info from the web" />
                          <FlatFeatureCard icon={<Terminal className="w-4 h-4" />} title="Shell Scripts" desc="Automate your workflow" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      {messages.map((msg) => (
                        <div key={msg.id} className={cn(
                          "flex gap-4",
                          msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}>
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                            msg.role === 'user' ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
                          )}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </div>
                          <div className={cn(
                            "max-w-[85%] space-y-1.5",
                            msg.role === 'user' ? "items-end" : "items-start"
                          )}>
                            <div className={cn(
                              "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                              msg.role === 'user' 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-secondary/50 text-foreground border border-border"
                            )}>
                              {msg.content.startsWith('![Generated Image]') ? (
                                <div className="space-y-2">
                                  <img 
                                    src={msg.content.match(/\((.*?)\)/)?.[1]} 
                                    alt="Generated" 
                                    className="rounded-lg max-w-full h-auto"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              ) : (
                                msg.content
                              )}
                            </div>
                            <div className="flex items-center gap-2 px-1">
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.role === 'assistant' && (
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleSpeak(msg.content)}
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded"
                                    title="Speak"
                                  >
                                    <Volume2 className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(msg.content);
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded"
                                    title="Copy"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      // Logic to regenerate could go here
                                      setInput(messages[messages.length - 2]?.content || '');
                                      handleSend();
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded"
                                    title="Regenerate"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
                            <Bot className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex gap-1 items-center px-4 py-3 bg-secondary/50 rounded-2xl border border-border">
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-background">
                  <div className="max-w-3xl mx-auto">
                    <div className="relative bg-card border border-border rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-primary/20 transition-all overflow-hidden">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-none focus:ring-0 text-sm py-3 px-4 resize-none min-h-[44px] max-h-[200px] no-scrollbar"
                        rows={1}
                      />
                      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-secondary/20">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Paperclip className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <ImageIcon className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-8 w-8 transition-colors",
                              isListening ? "text-primary animate-pulse bg-primary/10" : "text-muted-foreground"
                            )}
                            onClick={() => setIsListening(!isListening)}
                            title={isListening ? "Stop Listening" : "Voice Input"}
                          >
                            <Mic className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button 
                          onClick={handleSend}
                          disabled={!input.trim() || isTyping}
                          size="sm"
                          className="h-8 px-4 rounded-lg"
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dashboard" className="flex-1 m-0 p-8 overflow-auto flat-scrollbar">
                <div className="max-w-4xl mx-auto space-y-8">
                  <h2 className="text-2xl font-bold">System Dashboard</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DashboardCard icon={<Zap className="w-5 h-5 text-yellow-500" />} label="Throughput" value={`${metrics.tokensPerSecond} t/s`} />
                    <DashboardCard icon={<Cpu className="w-5 h-5 text-blue-500" />} label="Active Model" value={currentModel.name} />
                    <DashboardCard icon={<Clock className="w-5 h-5 text-green-500" />} label="Session Time" value="1h 24m" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Usage Over Time
                      </h3>
                      <div className="h-40 flex items-end gap-1">
                        {[40, 60, 45, 90, 65, 80, 50, 70, 85, 60, 75, 95].map((h, i) => (
                          <div key={i} className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary transition-colors" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Resource Allocation
                      </h3>
                      <div className="space-y-3">
                        <ResourceBar label="CPU" value={45} />
                        <ResourceBar label="Memory" value={72} />
                        <ResourceBar label="Network" value={28} />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="flex-1 m-0 p-8 overflow-auto flat-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Conversation History</h2>
                    <Button variant="outline" size="sm" className="rounded-lg">Clear All</Button>
                  </div>
                  <div className="space-y-3">
                    <HistoryItem title="Quantum Physics Basics" date="Today, 10:45 AM" />
                    <HistoryItem title="React Performance Optimization" date="Yesterday, 4:20 PM" />
                    <HistoryItem title="Dinner Recipe Ideas" date="Apr 7, 2026" />
                    <HistoryItem title="Travel Itinerary: Tokyo" date="Apr 5, 2026" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="docs" className="flex-1 m-0 p-8 overflow-auto flat-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Documents</h2>
                    <Button variant="outline" size="sm" className="rounded-lg">
                      <Plus className="w-4 h-4 mr-2" /> Upload
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DocCard title="Project_Aura_Spec.pdf" size="2.4 MB" type="PDF" />
                    <DocCard title="Research_Notes_Q1.docx" size="1.1 MB" type="DOCX" />
                    <DocCard title="Financial_Report_2025.xlsx" size="4.5 MB" type="XLSX" />
                    <DocCard title="Meeting_Minutes.txt" size="12 KB" type="TXT" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="web" className="flex-1 m-0 p-8 overflow-auto flat-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Web Search</h2>
                    <p className="text-muted-foreground text-sm">Search the live web for real-time information.</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search the web..." className="pl-10 h-12 rounded-xl" />
                  </div>
                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Trending Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Quantum Computing', 'AI Ethics', 'SpaceX Mars Mission', 'Global Economy', 'Renewable Energy'].map(tag => (
                        <Badge key={tag} variant="secondary" className="px-3 py-1 cursor-pointer hover:bg-secondary/80">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="vibecode" className="flex-1 m-0 flex flex-col overflow-hidden">
                <div className="flex-1 flex flex-col">
                  {/* Vibe Coding Header */}
                  <div className="p-4 border-b border-border bg-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <h2 className="text-lg font-bold">Vibe Coding</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex -space-x-2">
                              {teamModels.map((m, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-card bg-secondary flex items-center justify-center text-[10px] font-bold">
                                  {m.split('-')[1]?.toUpperCase().charAt(0) || 'G'}
                                </div>
                              ))}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>AI Teamwork Active: Architect, Developer, Reviewer</TooltipContent>
                        </Tooltip>
                        <Button variant="outline" size="sm" className="h-8">Configure Team</Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="Tell Aura what to build... (e.g. 'Build a snake game in React')" 
                          value={vibePrompt}
                          onChange={(e) => setVibePrompt(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleVibeCode()}
                          className="pr-24 h-11 rounded-xl"
                          disabled={isVibing}
                        />
                        {isVibing && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-primary font-medium">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            {vibeStep}...
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={handleVibeCode} 
                        disabled={!vibePrompt.trim() || isVibing}
                        className="h-11 px-6 rounded-xl gap-2"
                      >
                        <Sparkles className="w-4 h-4" /> Vibe
                      </Button>
                    </div>
                  </div>

                  <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-secondary/10">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Code className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">editor.js</span>
                      </div>
                      <select 
                        value={editorLanguage}
                        onChange={(e) => setEditorLanguage(e.target.value)}
                        className="bg-transparent text-[10px] font-bold border-none focus:ring-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1.5 px-2">
                        <Save className="w-3 h-3" /> Save
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1.5 px-2">
                        <Download className="w-3 h-3" /> Export
                      </Button>
                      <Separator orientation="vertical" className="h-3" />
                      <Button size="sm" className="h-7 text-[10px] gap-1.5 px-3 bg-primary hover:bg-primary/90">
                        <Play className="w-3 h-3" /> Run
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Editor
                      height="100%"
                      language={editorLanguage}
                      theme={isDarkMode ? "vs-dark" : "light"}
                      value={code}
                      onChange={(value) => setCode(value || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: 'JetBrains Mono',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 10 },
                        lineNumbers: 'on',
                        glyphMargin: false,
                        folding: true,
                        lineDecorationsWidth: 0,
                        lineNumbersMinChars: 3
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </DialogTitle>
              <DialogDescription>
                Customize your Aura Agent experience.
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh] -mx-4 px-4">
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Auto-speak Responses</Label>
                      <p className="text-xs text-muted-foreground">Play audio automatically after each message.</p>
                    </div>
                    <Switch checked={autoSpeak} onCheckedChange={setAutoSpeak} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Dark Mode</Label>
                      <p className="text-xs text-muted-foreground">Toggle between light and dark themes.</p>
                    </div>
                    <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Keyboard Shortcuts</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <ShortcutItem keys={["⌘", "B"]} label="Toggle Sidebar" />
                    <ShortcutItem keys={["⌘", "K"]} label="Focus Input" />
                    <ShortcutItem keys={["⌘", ","]} label="Settings" />
                    <ShortcutItem keys={["Alt", "1-6"]} label="Switch Tabs" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">API Configuration</Label>
                  <div className="space-y-2">
                    <Input 
                      type="password" 
                      placeholder="Enter your Gemini API Key" 
                      className="rounded-lg"
                    />
                    <p className="text-[10px] text-muted-foreground">Your key is stored locally in your browser.</p>
                  </div>
                </div>

                <Separator />

                <div className="pt-2">
                  <Button 
                    variant="destructive" 
                    className="w-full gap-2 rounded-lg"
                    onClick={() => {
                      setMessages([]);
                      setShowSettings(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4" /> Clear All Conversations
                  </Button>
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button onClick={() => setShowSettings(false)}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        active ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function MetricRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{label}</span>
      <span className="text-[10px] font-bold">{value}</span>
    </div>
  );
}

function FlatFeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <button className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-left group">
      <div className="p-2 bg-secondary rounded-lg text-primary shrink-0">
        {icon}
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

function DashboardCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-widest">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ResourceBar({ label, value }: { label: string, value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function HistoryItem({ title, date }: { title: string, date: string }) {
  return (
    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-left">
      <div className="space-y-0.5">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

function ShortcutItem({ keys, label }: { keys: string[], label: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border">
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {keys.map(key => (
          <kbd key={key} className="px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-mono shadow-sm">
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

function DocCard({ title, size, type }: { title: string, size: string, type: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-4 hover:bg-secondary/50 transition-colors cursor-pointer">
      <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">{title}</h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase">{type}</span>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="text-[10px] text-muted-foreground">{size}</span>
        </div>
      </div>
      <MoreVertical className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}
