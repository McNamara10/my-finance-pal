import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RecurringItem } from "@/hooks/useRecurringItems";

interface ProjectionData {
    month: string;
    balance: number;
    income: number;
    expenses: number;
    costOfLiving: number;
    net: number;
}

interface AdvancedProjectionProps {
    data: ProjectionData[];
    expenses: RecurringItem[];
    incomes: RecurringItem[];
}

const AdvancedProjection = ({ data, expenses, incomes }: AdvancedProjectionProps) => {
    const totalIncomes = incomes.filter(i => i.active).reduce((sum, i) => sum + i.amount, 0);
    const totalFixedExpenses = expenses.filter(e => e.active).reduce((sum, e) => sum + e.amount, 0);

    // Get simulation cost from first data point (it's constant for now)
    const simCost = data.length > 0 ? data[0].costOfLiving : 0;
    const totalExpenses = totalFixedExpenses + simCost;

    return (
        <div className="space-y-8 animate-fade-in">

            {/* 1. Main Chart Section */}
            <Card className="border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-xl">Proiezione Saldo</CardTitle>
                        <p className="text-sm text-muted-foreground">Andamento stimato per i prossimi 12 mesi</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <span>Saldo Previsto</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-success/50 border border-success border-dashed"></div>
                            <span>Entrata Mensile (€{totalIncomes})</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    tickFormatter={(value) => `€${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    }}
                                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                    formatter={(value: number) => [`€${value.toLocaleString('it-IT')}`, 'Saldo']}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem' }}
                                />
                                {/* Reference Line for Monthly Income (Average) - rendered as a constant line if requested, 
                    but since balance is cumulative, comparing it to monthly income might be confusing visually 
                    unless it's a "Goal" line. 
                    The screenshot showed "Entrata 1450" as a dashed line. Assuming it's a reference level 
                    on the same Y-axis implies the balance scale is comparable to monthly income, 
                    which is only true for the first month. 
                    However, if we want to follow the design, maybe it's "Balance" vs "Cumulative Income"?
                    Or just a visual marker. Let's put a ReferenceLine at the level of Total Income * 10 or something?
                    
                    Wait, looking at the screenshot, the "Entrata" line is at ~1500, but the points are at 1000, 2000, 3000. 
                    So the "Entrata" line essentially marks the "Monthly Volume". 
                    It serves as a scale reference. I'll add it as a ReferenceLine.
                */}
                                <ReferenceLine y={totalIncomes} stroke="hsl(var(--success))" strokeDasharray="3 3" label={{ position: 'right', value: `Entrata €${totalIncomes}`, fill: 'hsl(var(--success))', fontSize: 12 }} />

                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorBalance)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Breakdown Section ("Composizione Mensile") */}
            <Card className="border-border/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">💶 Composizione Mensile</CardTitle>
                        <div className="text-sm text-right">
                            <span className="text-muted-foreground mr-2">Uscite totali:</span>
                            <span className="font-bold text-destructive">€{totalExpenses}</span>
                            <span className="mx-3 text-border">|</span>
                            <span className="text-muted-foreground mr-2">Entrata:</span>
                            <span className="font-bold text-success">€{totalIncomes}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Recurring Expenses Cards */}
                        {expenses.filter(e => e.active).map(expense => (
                            <div key={expense.id} className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-sm truncate">{expense.name}</span>
                                    <span className="font-bold text-destructive">€{expense.amount}</span>
                                </div>
                                {/* Progress bar logic: % of total expenses */}
                                <Progress value={(expense.amount / totalExpenses) * 100} className="h-1.5 bg-secondary" indicatorClassName="bg-destructive/80" />
                            </div>
                        ))}

                        {/* Simulation Cost Card */}
                        {simCost > 0 && (
                            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-sm text-primary">Vita quotidiana</span>
                                    <span className="font-bold text-primary">€{simCost}</span>
                                </div>
                                <Progress value={(simCost / totalExpenses) * 100} className="h-1.5 bg-secondary" indicatorClassName="bg-primary" />
                            </div>
                        )}

                        {/* Savings/buffer Card */}
                        {totalIncomes > totalExpenses && (
                            <div className="bg-success/5 rounded-xl p-4 border border-success/20 lg:col-start-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-sm text-success">Risparmio Previsto</span>
                                    <span className="font-bold text-success">+€{totalIncomes - totalExpenses}</span>
                                </div>
                                <div className="text-xs text-success/80 mt-2">
                                    Avance mensile disponibile
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 3. Monthly Progress View ("Mese per mese") */}
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="text-lg">🗓️ Mese per mese</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.map((monthData, index) => {
                            const growth = index > 0 ? monthData.balance - data[index - 1].balance : monthData.net;
                            return (
                                <div key={index} className="bg-card hover:bg-secondary/20 transition-colors p-4 rounded-xl border border-dashed border-border/60">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center font-bold text-lg">
                                                {monthData.month}
                                            </div>
                                            <Progress value={Math.min(100, (monthData.balance / (monthData.balance + 1000)) * 100)} className="w-32 md:w-64 h-2" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold">€{monthData.balance.toLocaleString('it-IT')}</div>
                                            <div className={`text-xs ${growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                                                {growth >= 0 ? '+' : ''}€{growth} vs mese prima
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
};

export default AdvancedProjection;
