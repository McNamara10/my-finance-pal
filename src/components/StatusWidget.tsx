import { Activity, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type FinancialStatus = "ok" | "warning" | "critical";

interface StatusWidgetProps {
    status: FinancialStatus;
    margin: number;
}

const StatusWidget = ({ status, margin }: StatusWidgetProps) => {
    const config = {
        ok: {
            label: "Tutto Sotto Controllo",
            subLabel: "Le tue finanze sono in salute",
            color: "text-success",
            bgColor: "bg-success/10",
            icon: CheckCircle2,
            description: `Hai un margine di sicurezza di €${margin.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
            borderColor: "border-success/20"
        },
        warning: {
            label: "Attenzione Necessaria",
            subLabel: "Sei vicino al limite del budget",
            color: "text-warning",
            bgColor: "bg-warning/10",
            icon: AlertTriangle,
            description: `Il tuo margine è ridotto (€${margin.toLocaleString('it-IT', { minimumFractionDigits: 2 })}). Monitora le spese.`,
            borderColor: "border-warning/20"
        },
        critical: {
            label: "Stato Critico",
            subLabel: "Le spese superano le disponibilità",
            color: "text-destructive",
            bgColor: "bg-destructive/10",
            icon: XCircle,
            description: `Sei in deficit di €${Math.abs(margin).toLocaleString('it-IT', { minimumFractionDigits: 2 })}. Rivedi subito il piano!`,
            borderColor: "border-destructive/20"
        }
    };

    const current = config[status];
    const Icon = current.icon;

    return (
        <div className={cn(
            "widget-card animate-scale-in border-l-4 transition-all hover:shadow-lg",
            current.borderColor,
            status === "ok" ? "border-l-success" : status === "warning" ? "border-l-warning" : "border-l-destructive"
        )}>
            <div className="flex items-start gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", current.bgColor)}>
                    <Icon className={cn("w-6 h-6", current.color)} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stato Finanziario</p>
                        <Activity className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                    <h3 className={cn("text-lg font-bold truncate", current.color)}>
                        {current.label}
                    </h3>
                    <p className="text-sm font-medium text-foreground/80 leading-snug">
                        {current.subLabel}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 bg-secondary/30 p-2 rounded-lg italic">
                        {current.description}
                    </p>
                </div>
            </div>

            {/* Visual progress bar representation (simplified) */}
            <div className="mt-4 h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full transition-all duration-1000",
                        status === "ok" ? "bg-success w-full" : status === "warning" ? "bg-warning w-2/3" : "bg-destructive w-1/3"
                    )}
                />
            </div>
        </div>
    );
};

export default StatusWidget;
