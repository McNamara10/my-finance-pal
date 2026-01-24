import Header from "@/components/Header";
import DashboardNav from "@/components/DashboardNav";
import BalanceWidget from "@/components/BalanceWidget";
import ProjectionWidget from "@/components/ProjectionWidget";
import SalaryWidget from "@/components/SalaryWidget";
import ProjectionChart from "@/components/ProjectionChart";
import TipCard from "@/components/TipCard";
import RecentActivityLive from "@/components/RecentActivityLive";
import FinancialHealth from "@/components/FinancialHealth";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <DashboardNav />
        
        {/* Financial Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <BalanceWidget />
          <ProjectionWidget />
          <SalaryWidget />
        </div>
        
        {/* Projection Chart */}
        <div className="mb-6">
          <ProjectionChart />
        </div>
        
        {/* Tip Card */}
        <div className="mb-6">
          <TipCard />
        </div>
        
        {/* Activity & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentActivityLive />
          <FinancialHealth />
        </div>
      </main>
    </div>
  );
};

export default Index;
