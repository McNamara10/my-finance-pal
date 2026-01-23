import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Inserisci email e password");
      return;
    }

    if (password.length < 6) {
      toast.error("La password deve avere almeno 6 caratteri");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email o password non validi");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Accesso effettuato!");
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("Utente già registrato. Prova ad accedere.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Registrazione completata! Benvenuto.");
          navigate("/");
        }
      }
    } catch (err) {
      toast.error("Si è verificato un errore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="widget-card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">FP</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">FinProjection</h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Accedi al tuo account" : "Crea un nuovo account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                "Caricamento..."
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Accedi
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Registrati
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Non hai un account?" : "Hai già un account?"}
              <Button
                variant="link"
                className="px-2"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Registrati" : "Accedi"}
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
