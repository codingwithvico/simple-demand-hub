import { useState } from "react";
import { Demand } from "@/types/demand";
import DemandCard from "@/components/DemandCard";
import DemandInput from "@/components/DemandInput";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
  const { signOut } = useAuth();
  const [demands, setDemands] = useState<Demand[]>([
    {
      id: "1",
      text: "Revisar documentação do projeto antes da reunião de sexta",
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "2", 
      text: "Finalizar relatório mensal de vendas",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: "3",
      text: "Enviar proposta comercial para o cliente ABC",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
  ]);

  const addDemand = (text: string) => {
    const newDemand: Demand = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date(),
    };
    setDemands([newDemand, ...demands]);
  };

  const deleteDemand = (id: string) => {
    setDemands(demands.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto border-x border-border min-h-screen">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
          <h1 className="text-foreground font-semibold text-lg">Demandas</h1>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        
        <DemandInput onSubmit={addDemand} />
        
        <main>
          {demands.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              Nenhuma demanda ainda. Adicione a primeira!
            </div>
          ) : (
            demands.map((demand) => (
              <DemandCard 
                key={demand.id} 
                demand={demand} 
                onDelete={deleteDemand}
              />
            ))
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
