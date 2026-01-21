import { TrendingUp, ArrowUpRight } from "lucide-react";

const ProjectionWidget = () => {
  return (
    <div className="widget-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-success" />
        </div>
        <span className="stat-label">Proiezione (29 Jan)</span>
      </div>
      <p className="stat-value">€2.244,00</p>
      <div className="flex items-center gap-1.5 mt-1">
        <ArrowUpRight className="w-4 h-4 text-success" />
        <span className="positive-change text-sm">+€1.450,00 (182.6%)</span>
      </div>
    </div>
  );
};

export default ProjectionWidget;
