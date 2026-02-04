

# Plano: Demandas Atrasadas no Kanban

## Contexto Atual
Atualmente, o Kanban exibe apenas demandas criadas no dia atual, usando filtros de data (`gte` e `lt` no `created_at`). Isso significa que demandas não finalizadas de dias anteriores desaparecem do painel no dia seguinte.

## Objetivo
1. Demandas **abertas** ou **em andamento** de dias anteriores devem continuar aparecendo no Kanban
2. Demandas atrasadas devem exibir uma **tag visual de atraso** indicando que são de dias anteriores
3. Demandas **finalizadas** devem continuar mostrando apenas as do dia atual (manter comportamento)

## Solução Proposta

### 1. Modificar a Query no `useDemands.tsx`

**Nova lógica de busca:**
- Buscar todas as demandas com `status = 'open'` OU `status = 'in_progress'` (independente da data)
- **TAMBÉM** buscar demandas com `status = 'completed'` E `completed_at` no dia atual

```text
+---------------------------+
|      Demandas a buscar    |
+---------------------------+
| status IN (open, in_progress)  -- todas as datas
| OR
| (status = completed AND completed_at >= hoje)
+---------------------------+
```

### 2. Adicionar Identificação de Atraso

**No tipo `DemandWithProfile`:**
- Adicionar propriedade calculada `isDelayed` (boolean)
- Uma demanda é considerada **atrasada** se:
  - `status !== 'completed'` E
  - `created_at` é de um dia anterior ao dia atual

### 3. Atualizar o `DemandCard.tsx`

**Adicionar tag visual de atraso:**
- Badge vermelho/laranja com texto "Atrasada" ou ícone de alerta
- Exibir há quantos dias está atrasada (ex: "Atrasada (2d)")
- Posicionar próximo ao header ou no footer do card

```text
+--------------------------------+
|  [Avatar] Nome do Usuário      |
|  Tipo de Demanda    [ATRASADA] |  <-- Nova tag
|--------------------------------|
|  [Clock] 2d  [Comments] 1      |
+--------------------------------+
```

### 4. Atualizar o `KanbanBoard.tsx`

**Ordenação das colunas:**
- Na coluna "Demandas Recebidas": mostrar demandas atrasadas primeiro, depois as do dia
- Na coluna "Em Andamento": mesmo comportamento
- Manter a ordem cronológica dentro de cada grupo

**Contagem separada (opcional):**
- Exibir contagem de atrasadas vs. do dia no header da coluna

### 5. Atualizar o `Index.tsx`

- Adicionar lógica para calcular `isDelayed` em cada demanda antes de passar para o Kanban

---

## Detalhes Técnicos

### Alteração na Query SQL (useDemands.tsx)

```typescript
// Antes: filtrava por created_at do dia
.gte("created_at", startOfDay.toISOString())
.lt("created_at", endOfDay.toISOString())

// Depois: usar .or() para combinar condições
.or(
  `status.in.(open,in_progress),and(status.eq.completed,completed_at.gte.${startOfDay.toISOString()},completed_at.lt.${endOfDay.toISOString()})`
)
```

### Cálculo de isDelayed (Index.tsx ou useDemands.tsx)

```typescript
const isDelayed = (demand: DemandWithProfile): boolean => {
  if (demand.status === 'completed') return false;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return demand.created_at < startOfToday;
};
```

### Tag Visual no DemandCard

```typescript
// Badge de atraso com dias
const daysDelayed = Math.floor(
  (Date.now() - demand.created_at.getTime()) / (1000 * 60 * 60 * 24)
);

{isDelayed && (
  <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
    Atrasada ({daysDelayed}d)
  </span>
)}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useDemands.tsx` | Modificar query para buscar demandas pendentes de qualquer data + concluídas do dia |
| `src/types/demand.ts` | Adicionar propriedade `isDelayed?: boolean` na interface |
| `src/components/DemandCard.tsx` | Adicionar tag visual de atraso |
| `src/components/KanbanBoard.tsx` | Ordenar demandas atrasadas primeiro |
| `src/pages/Index.tsx` | Calcular `isDelayed` para cada demanda |

---

## Resultado Esperado

- Demandas não finalizadas nunca "somem" do Kanban
- Demandas atrasadas são facilmente identificáveis com badge visual
- Priorização visual: atrasadas aparecem no topo da fila
- Demandas concluídas continuam mostrando apenas as do dia (evitar poluição visual)

