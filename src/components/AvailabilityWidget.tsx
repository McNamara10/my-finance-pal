import { Wallet, Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface AvailabilityWidgetProps {
    availability: number;
}

const AvailabilityWidget = ({ availability }: AvailabilityWidgetProps) => {
    return (
        <div className="widget-card animate-scale-in relative overflow-hidden group">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Disponibilità Reale</p>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[200px] text-xs">
                                    Saldo Effettivo - Spese Fisse Rimaste - Budget Preventivato
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">
                        €{availability.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Soldi "sicuri" da spendere</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wallet className="w-5 h-5 text-primary" />
                </div>
            </div>

            {/* Decorative background element */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
        </div>
    );
};

export default AvailabilityWidget;
