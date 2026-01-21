import { Lightbulb } from "lucide-react";

const TipCard = () => {
  return (
    <div className="bg-accent/50 border border-border rounded-xl p-4 flex items-start gap-3 animate-fade-in" style={{ animationDelay: "0.4s" }}>
      <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
        <Lightbulb className="w-4 h-4 text-warning" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Suggerimento</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Mantieni aggiornate le spese ricorrenti per una migliore precisione nelle proiezioni.
        </p>
      </div>
    </div>
  );
};

export default TipCard;
