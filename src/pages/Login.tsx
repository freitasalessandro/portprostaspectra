import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import spectraLogo from "@/assets/spectra-logo.svg";
import { staggerContainer, fadeUp } from "@/lib/motion";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "Conta criada com sucesso!", description: "Você já pode acessar o painel." });
        navigate("/admin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/admin");
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-[0.04]" />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[200px] rounded-full pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/20 pointer-events-none"
          style={{ left: `${25 + i * 15}%`, top: `${20 + (i % 3) * 20}%` }}
          animate={{ y: [0, -20, 0], opacity: [0, 0.5, 0] }}
          transition={{ duration: 5 + i, delay: i * 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <motion.div
        className="w-full max-w-sm relative z-10"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex flex-col items-center mb-10" variants={fadeUp}>
          <motion.img
            src={spectraLogo}
            alt="Spectra"
            className="w-12 h-10 mb-5"
            style={{ filter: "drop-shadow(0 0 20px hsl(220 100% 55% / 0.4))" }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            SPECTR<span className="text-gradient-intense">A</span>
          </h1>
          <p className="text-muted-foreground/50 text-xs mt-3 tracking-[0.2em] uppercase font-body">
            Painel Administrativo
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleAuth}
          className="glass-card-premium p-8 space-y-5 relative overflow-hidden"
          variants={fadeUp}
        >
          {/* Shimmer accent */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-[0.15em] text-muted-foreground/60 font-body">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@spectra.com"
              required
              className="bg-background/50 border-border/30 focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-[0.15em] text-muted-foreground/60 font-body">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-background/50 border-border/30 focus:border-primary/50 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full font-display uppercase tracking-[0.2em] text-xs py-5 relative overflow-hidden group glow-box"
            disabled={loading}
          >
            <span className="relative z-10">
              {loading ? "Carregando..." : isSignUp ? "Criar Conta" : "Entrar"}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </Button>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-center text-xs text-muted-foreground/40 hover:text-primary/80 transition-colors font-body tracking-wide"
          >
            {isSignUp ? "Já tem conta? Faça login" : "Primeiro acesso? Crie sua conta"}
          </button>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login;
