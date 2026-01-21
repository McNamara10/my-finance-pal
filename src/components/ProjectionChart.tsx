import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const data = [
  { month: "Jan 21", balance: 794 },
  { month: "Feb", balance: 920 },
  { month: "Mar", balance: 1100 },
  { month: "Apr", balance: 1050 },
  { month: "May", balance: 1280 },
  { month: "Jun", balance: 1450 },
  { month: "Jul", balance: 1380 },
  { month: "Aug", balance: 1620 },
  { month: "Sep", balance: 1750 },
  { month: "Oct", balance: 1890 },
  { month: "Nov", balance: 2050 },
  { month: "Dec", balance: 2244 },
];

const ProjectionChart = () => {
  return (
    <div className="widget-card animate-fade-in col-span-full" style={{ animationDelay: "0.3s" }}>
      <div className="mb-6">
        <h3 className="section-title">Proiezione Saldo</h3>
        <p className="section-subtitle mt-1">Traiettoria finanziaria stimata per i prossimi 12 mesi</p>
      </div>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(213 56% 24%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(213 56% 24%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 15% 50%)', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 15% 50%)', fontSize: 12 }}
              tickFormatter={(value) => `€${value}`}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(0 0% 100%)',
                border: '1px solid hsl(214 20% 90%)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px hsl(215 25% 17% / 0.08)',
              }}
              formatter={(value: number) => [`€${value.toLocaleString('it-IT')}`, 'Saldo']}
              labelStyle={{ color: 'hsl(215 25% 17%)', fontWeight: 600 }}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="hsl(213 56% 24%)"
              strokeWidth={2.5}
              fill="url(#colorBalance)"
              dot={false}
              activeDot={{ r: 6, fill: 'hsl(213 56% 24%)', stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectionChart;
