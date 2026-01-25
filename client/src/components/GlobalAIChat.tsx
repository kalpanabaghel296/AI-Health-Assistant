import { useState, useRef, useEffect } from "react";
import { useChat, useImageAnalysis } from "@/hooks/use-health-data";
import { MessageCircle, X, Send, Bot, User, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "bot";
  content: string;
  image?: string;
}

export function GlobalAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hello! I'm your health assistant. Describe your symptoms or concern, and I'll provide focused guidance. You can also upload an image for analysis." }
  ]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const chatMutation = useChat();
  const imageAnalysisMutation = useImageAnalysis();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;
    
    const userMsg = input;
    const userImage = selectedImage;
    
    setInput("");
    setSelectedImage(null);
    
    setMessages(prev => [...prev, { 
      role: "user", 
      content: userMsg || "Analyze this image", 
      image: userImage || undefined 
    }]);

    try {
      if (userImage) {
        const response = await imageAnalysisMutation.mutateAsync({ 
          image: userImage,
          context: userMsg 
        });
        setMessages(prev => [...prev, { role: "bot", content: response.analysis }]);
      } else {
        const response = await chatMutation.mutateAsync(userMsg);
        setMessages(prev => [...prev, { role: "bot", content: response.reply }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "bot", 
        content: "I couldn't process that request. Please try describing your concern differently." 
      }]);
    }
  };

  const isPending = chatMutation.isPending || imageAnalysisMutation.isPending;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-4 md:bottom-24 md:right-8 w-[90vw] md:w-[420px] h-[520px] bg-card rounded-2xl shadow-2xl border border-border z-[100] flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-primary text-primary-foreground flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-display font-bold">Health Assistant</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/20 p-1 rounded"
                data-testid="button-close-chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ScrollArea className="flex-1 p-4 bg-muted/30">
              <div className="flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                    }`}>
                      {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-card text-card-foreground border border-border rounded-tl-sm shadow-sm"
                    }`}>
                      {msg.image && (
                        <img 
                          src={msg.image} 
                          alt="Uploaded" 
                          className="max-w-full rounded-lg mb-2 max-h-32 object-cover"
                        />
                      )}
                      <span className="whitespace-pre-wrap selection:bg-primary/30 selection:text-foreground">{msg.content}</span>
                    </div>
                  </div>
                ))}
                {isPending && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-card px-4 py-3 rounded-2xl rounded-tl-sm border border-border shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-75" />
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-150" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {selectedImage && (
              <div className="px-4 py-2 bg-muted/50 border-t border-border">
                <div className="relative inline-block">
                  <img src={selectedImage} alt="Preview" className="h-16 rounded-lg" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 border-t border-border bg-background">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className="rounded-xl shrink-0"
                  data-testid="button-upload-image"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your concern..."
                  className="rounded-xl"
                  disabled={isPending}
                  data-testid="input-chat-message"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-xl bg-primary hover:bg-primary/90 shrink-0"
                  disabled={(!input.trim() && !selectedImage) || isPending}
                  data-testid="button-send-message"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-4 md:right-8 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-[99] transition-all`}
        data-testid="button-open-chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
      </motion.button>
    </>
  );
}
