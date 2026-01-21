import { LayoutDashboard, ArrowLeftRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: ArrowLeftRight, label: "Transazioni", active: false },
  { icon: Settings, label: "Impostazioni Mensili", active: false },
];

const DashboardNav = () => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <LayoutDashboard className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">La tua salute finanziaria a colpo d'occhio</h2>
      </div>
      
      <div className="flex gap-2 mb-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <button
              key={item.label}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                "bg-secondary text-secondary-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>
      
      <div className="h-px bg-border mb-6" />
    </div>
  );
};

export default DashboardNav;
