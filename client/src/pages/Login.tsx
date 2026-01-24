import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Wallet, Activity, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { login, isLoggingIn } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/50 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left: Content */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Activity className="w-4 h-4" />
              <span>Web3 Health Tracking</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground leading-tight">
              Your Health, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Owned by You.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              AI-powered diagnostics and health management, secured by your wallet. 
              Privacy-first, personalized, and intelligent.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              onClick={() => login()} 
              disabled={isLoggingIn}
              className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 text-lg font-semibold transition-all"
            >
              {isLoggingIn ? (
                <>Connecting...</>
              ) : (
                <>
                  <Wallet className="mr-2 w-5 h-5" />
                  Connect Wallet
                </>
              )}
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-lg font-medium">
              Learn more <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-8 pt-4">
            <div>
              <p className="text-2xl font-bold text-foreground">10k+</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground">98%</p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground">Zero</p>
              <p className="text-sm text-muted-foreground">Data Leaks</p>
            </div>
          </div>
        </motion.div>

        {/* Right: Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden md:block"
        >
          {/* Abstract circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -z-10 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl -z-10" />

          {/* Hero Image / UI Mockup */}
          {/* Using Unsplash image for lifestyle/health context */}
          {/* health fitness lifestyle woman running */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 rotate-3 hover:rotate-0 transition-transform duration-500">
             <img 
               src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80" 
               alt="Health Tracking" 
               className="w-full h-auto object-cover"
             />
             <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                <p className="font-display font-bold text-xl">Daily Activity</p>
                <p className="text-white/80">Goal reached: 8,432 steps</p>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
