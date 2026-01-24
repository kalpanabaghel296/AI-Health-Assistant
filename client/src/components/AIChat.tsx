import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-health-data";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "bot";
  content: string;
}

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hi! I'm your health assistant. How are you feeling today?" }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const chatMutation = useChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);

    try {
      const response = await chatMutation.mutateAsync(userMsg);
      setMessages(prev => [...prev, { role: "bot", content: response.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", content: "Sorry, I couldn't process that. Try again?" }]);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-4 md:bottom-24 md:right-8 w-[90vw] md:w-[400px] h-[500px] bg-card rounded-2xl shadow-2xl border border-border z-50 flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-primary text-primary-foreground flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-display font-bold">Health Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
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
                        : "bg-white border border-border rounded-tl-sm shadow-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-border shadow-sm">
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

            <div className="p-4 border-t border-border bg-background">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your symptoms..."
                  className="rounded-xl"
                  disabled={chatMutation.isPending}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-xl bg-primary hover:bg-primary/90"
                  disabled={!input.trim() || chatMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-4 md:right-8 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-40 transition-all ${
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <MessageCircle className="w-7 h-7" />
      </motion.button>
    </>
  );
}
