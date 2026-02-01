import { useState, useRef, useEffect } from "react";
import { format, addMonths, setDate, startOfDay, isBefore, isSameDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTransactions } from "@/hooks/useTransactions";
import { useRecurringExpenses, useRecurringIncomes } from "@/hooks/useRecurringItems";
import { Send, Sparkles, Bot, User } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ExtraItem {
    amount: number;
    label: string;
    type: "income" | "expense";
}

const AIAssistant = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Ciao! Sono Gemini 3 Pro. Posso proiettare il tuo saldo nel futuro.\n\nScrivimi una data (es. \"15 Maggio 2026\") per iniziare. Puoi anche dirmi \"aggiungi una spesa di 500€\" per vedere come influisce!"
        }
    ]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Simulation State
    const [targetDate, setTargetDate] = useState<Date | null>(null);
    const [extras, setExtras] = useState<ExtraItem[]>([]);

    const { transactions } = useTransactions();
    const { incomes } = useRecurringIncomes();
    const { expenses } = useRecurringExpenses();

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const parseItalianDate = (text: string): Date | null => {
        const months = [
            "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
            "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"
        ];

        // Normalize text
        const lowerText = text.toLowerCase();

        // Try "d MMMM yyyy" or "d MMMM"
        for (let i = 0; i < months.length; i++) {
            if (lowerText.includes(months[i])) {
                // Simple regex to extract day and year around the month
                const regex = new RegExp(`(\\d{1,2})\\s+${months[i]}(\\s+(\\d{4}))?`);
                const match = lowerText.match(regex);
                if (match) {
                    const day = parseInt(match[1]);
                    const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
                    // Construct date (month is 0-indexed in JS Date, but we need 1-indexed string logic or direct constr)
                    return new Date(year, i, day);
                }
            }
        }

        // Check for standard formats "DD/MM/YYYY" or "YYYY-MM-DD"
        const simpleDateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (simpleDateMatch) {
            return new Date(parseInt(simpleDateMatch[3]), parseInt(simpleDateMatch[2]) - 1, parseInt(simpleDateMatch[1]));
        }

        return null;
    };

    const parseMultipleItems = (text: string): ExtraItem[] => {
        const lowerText = text.toLowerCase();
        const items: ExtraItem[] = [];

        // Regex global for amounts: looks for numbers followed optionally by euro symbol or word
        // We look for patterns like: "80 euro", "80€", "80", "80.50"
        // avoiding dates like "2026" if possible (simple heuristic: dates are usually 4 digits, expenses usually 2-3 or have decimals)
        // But for now let's just match numbers and refine context.
        const regex = /(\d+([.,]\d{1,2})?)\s*(?:€|euro)?/gi;

        let match;
        // extended blacklist for years
        const currentYear = new Date().getFullYear();

        while ((match = regex.exec(lowerText)) !== null) {
            const valStr = match[1].replace(',', '.');
            const amount = parseFloat(valStr);

            // Skip common year-like numbers if they look like the current or next year context ONLY if they are not explicitly money
            const isExplicitMoney = match[0].includes('€') || match[0].includes('euro');
            if (!isExplicitMoney && (amount === currentYear || amount === currentYear + 1 || amount === currentYear - 1)) {
                continue;
            }

            // IGNORE DATES: look ahead for month names to avoid parsing "28 febbraio" as 28 euros.
            const textAfterMatch = lowerText.slice(regex.lastIndex).trim().toLowerCase();
            const monthNames = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
            const startsWithMonth = monthNames.some(month => textAfterMatch.startsWith(month));

            if (!isExplicitMoney && startsWithMonth) {
                continue;
            }

            if (isNaN(amount)) continue;

            // Context search: Look at words BEFORE and AFTER the match to determine type and label.
            // We take a window of text around the match.
            const startIndex = Math.max(0, match.index - 20);
            const endIndex = Math.min(lowerText.length, regex.lastIndex + 20);
            const context = lowerText.slice(startIndex, endIndex);

            let type: "income" | "expense" = "expense"; // default
            if (context.includes("entrata") || context.includes("guadagno") || context.includes("ricevo") || context.includes("bonus") || context.includes("stipendio")) {
                type = "income";
            } else if (context.includes("spesa") || context.includes("pagare") || context.includes("costo") || context.includes("per") || context.includes("di")) {
                type = "expense";
            }

            // Simple Label Extraction: grab the words immediately following (e.g. "per palestra")
            // Take substring from right after the match
            const postMatch = lowerText.slice(regex.lastIndex).trim().split(/[\s,.]+/);
            const labelCandidates = postMatch.slice(0, 3).join(" "); // take next 3 words
            const label = labelCandidates ? `(${labelCandidates})` : "Simulazione";

            items.push({ amount, type, label });
        }

        return items;
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg = { role: "user" as const, content: inputText };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        setInputText("");

        // SIMULATION OF AI LOGIC
        setTimeout(() => {
            let responseContent = "";
            let newDate = parseItalianDate(userMsg.content);
            const newExtras = parseMultipleItems(userMsg.content);

            let currentTargetDate = newDate || targetDate;
            let currentExtras = [...extras];

            if (newExtras.length > 0) {
                // Filter out duplicates or unintended partial matches if necessary, but for now just add all
                newExtras.forEach(item => currentExtras.push(item));
                setExtras(currentExtras);
            }

            if (newDate) {
                setTargetDate(newDate);
            }

            if (!currentTargetDate) {
                responseContent = "Per farti una proiezione, ho bisogno di una data. Prova con '15 Agosto 2026'.";
            } else {
                const projection = calculateProjection(currentTargetDate, currentExtras);
                const formattedDate = format(currentTargetDate, "d MMMM yyyy", { locale: it });
                const formattedBalance = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(projection);

                const extrasSummary = currentExtras.length > 0
                    ? `\n\n(Include ${currentExtras.length} transazioni extra simulate)`
                    : "";

                if (newExtras.length > 0) {
                    const descriptions = newExtras.map(e => `${e.type === 'income' ? '+' : '-'}${e.amount}€ ${e.label}`).join(", ");
                    responseContent = `Ho aggiunto: ${descriptions}.\n\n`;
                } else if (newDate) {
                    responseContent = `Ho impostato la data al ${formattedDate}.\n\n`;
                }

                responseContent += `Il saldo previsto per il **${formattedDate}** è di **${formattedBalance}**.${extrasSummary}`;
            }

            const assistantMsg = {
                role: "assistant" as const,
                content: responseContent
            };

            setMessages(prev => [...prev, assistantMsg]);
            setLoading(false);
        }, 1000);
    };

    const calculateProjection = (target: Date, activeExtras: ExtraItem[]) => {
        const now = new Date();
        const currentBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
        let projected = currentBalance;

        const nextDateForDayOfMonth = (day: number, current: Date) => {
            const candidate = setDate(current, day);
            const today = startOfDay(current);
            return isBefore(candidate, today) ? addMonths(candidate, 1) : candidate;
        };

        // Calculate recurring
        expenses.filter(e => e.active).forEach(expense => {
            let nextOccur = nextDateForDayOfMonth(expense.day, now);
            const startDateStr = expense.start_date || '2026-01-01';
            const startDate = parseISO(startDateStr);
            while (isBefore(nextOccur, target) || isSameDay(nextOccur, target)) {
                if (isBefore(startDate, nextOccur) || isSameDay(startDate, nextOccur)) {
                    projected -= expense.amount;
                }
                nextOccur = addMonths(nextOccur, 1);
            }
        });

        incomes.filter(i => i.active).forEach(income => {
            let nextOccur = nextDateForDayOfMonth(income.day, now);
            const startDateStr = income.start_date || '2026-01-01';
            const startDate = parseISO(startDateStr);
            while (isBefore(nextOccur, target) || isSameDay(nextOccur, target)) {
                if (isBefore(startDate, nextOccur) || isSameDay(startDate, nextOccur)) {
                    projected += income.amount;
                }
                nextOccur = addMonths(nextOccur, 1);
            }
        });

        // Add extras
        activeExtras.forEach(item => {
            if (item.type === "income") projected += item.amount;
            else projected -= item.amount;
        });

        return projected;
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 pt-24 pb-12 flex flex-col h-[calc(100vh-100px)]">
                <Card className="flex-1 flex flex-col shadow-lg border-primary/20">
                    <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md animate-pulse">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Gemini 3 Pro Assistant</CardTitle>
                                <CardDescription>Chatta per simulare spese e vedere il futuro</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                            <div className="space-y-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-none'
                                            : 'bg-secondary/80 text-secondary-foreground rounded-bl-none backdrop-blur-sm'
                                            }`}>
                                            {msg.role === 'assistant' && (
                                                <div className="flex items-center gap-2 mb-1 text-xs opacity-70 font-semibold">
                                                    <Bot className="w-3 h-3" />
                                                    <span>Gemini 3 Pro</span>
                                                </div>
                                            )}
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-secondary/50 text-secondary-foreground rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                                            <div className="flex gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <div className="flex gap-2 items-center relative">
                                <Input
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    className="flex-1 pr-12 h-12 rounded-full border-border/50 focus-visible:ring-primary/20"
                                    placeholder="Es: 'Spenderò 200€ per la spesa il 15 Marzo'..."
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!inputText.trim() || loading}
                                    size="icon"
                                    className="absolute right-1 w-10 h-10 rounded-full shadow-sm hover:shadow-md transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AIAssistant;
