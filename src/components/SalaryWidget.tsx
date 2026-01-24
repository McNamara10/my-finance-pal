import { CalendarClock, Sparkles } from "lucide-react";

type SalaryWidgetProps = {
  badgeLabel: string;
  badgeVariant: "incoming" | "not-set";
  dayLabel: string;
  subtitle: string;
};

const SalaryWidget = ({ badgeLabel, badgeVariant, dayLabel, subtitle }: SalaryWidgetProps) => {
  const isIncoming = badgeVariant === "incoming";

  return (
    <div className="widget-card animate-fade-in relative overflow-hidden" style={{ animationDelay: "0.2s" }}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
          <CalendarClock className="w-4 h-4 text-warning" />
        </div>
        <span className="stat-label">Prossimo Stipendio</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={
            isIncoming
              ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success"
              : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground"
          }
        >
          {isIncoming ? <Sparkles className="w-3 h-3" /> : null}
          {badgeLabel}
        </span>
      </div>
      <p className="text-lg font-semibold text-foreground mt-3">{dayLabel}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
};

export default SalaryWidget;
