
# Plano: Kanban para Usuarios Convencionais

## Resumo

Substituir o componente `UserDemandsList` (lista simples) pelo mesmo layout Kanban usado no painel administrativo, mas adaptado para usuarios comuns: sem acoes de admin (assumir, concluir, excluir), exibindo apenas as demandas do proprio usuario, com posicao na fila visivel e detalhamento completo nos cards.

## O que muda para o usuario

- A visualizacao em lista simples ("Minhas Demandas") sera substituida por um Kanban com 3 colunas:
  - **Enviadas**: demandas com status `open`, mostrando a posicao na fila (#1, #2, etc.)
  - **Em Andamento**: demandas com status `in_progress`, atualizadas em tempo real
  - **Finalizadas**: demandas com status `completed` do dia atual
- Os cards terao o mesmo nivel de detalhe do painel administrativo (tipo de demanda, campos, data, comentarios, tag de atraso)
- Nao havera menu de acoes (assumir, concluir, excluir) nos cards -- o usuario apenas visualiza
- Clicar no card continua abrindo o dialog de detalhes com comentarios

## Arquivos a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Index.tsx` | Substituir `UserDemandsList` pelo `KanbanBoard` para usuarios comuns, passando as demandas ja separadas por status. Remover import do `UserDemandsList`. |
| `src/components/KanbanBoard.tsx` | Ajustar os titulos das colunas conforme o contexto (master vs user). Quando `isMaster` for `false`, a coluna open mostra "Enviadas" em vez de "Recebidas". Garantir que a posicao na fila (`queuePosition`) apareca nos cards da coluna open. |

## Detalhes tecnicos

### Index.tsx

O `Index.tsx` ja calcula `openDemands`, `inProgressDemands` e `completedDemands` com o `useMemo`. Atualmente, essas variaveis so sao passadas para o `KanbanBoard` quando `isMaster === true`. A mudanca e simples: passar o mesmo `KanbanBoard` para usuarios comuns tambem, mas sem as funcoes de admin (`onClaim`, `onComplete`, `onUnclaim` serao `undefined`) e com `isMaster={false}`.

```typescript
// Antes (usuario comum)
<UserDemandsList demands={demands} />

// Depois (usuario comum - mesmo KanbanBoard)
<KanbanBoard
  openDemands={openDemands}
  inProgressDemands={inProgressDemands}
  completedDemands={completedDemands}
  onDelete={deleteDemand}
  isMaster={false}
/>
```

O `useDemands` ja filtra por `created_by = user.id` quando `isMaster` e `false`, entao a seguranca de dados ja esta garantida.

### KanbanBoard.tsx

Ajustar os titulos das colunas baseado no prop `isMaster`:

- Coluna open: "Recebidas" (master) ou "Enviadas" (user)
- Coluna in-progress: "Em Andamento" (ambos)
- Coluna completed: "Finalizadas" (ambos)

Os cards na coluna "Enviadas" devem mostrar `queuePosition` para que o usuario saiba sua posicao na fila.

### Posicao na Fila

A posicao na fila (`queuePosition`) ja e passada pelo `KanbanBoard` para os cards da coluna open (via `index + 1`). Isso ja funciona e mostrara ao usuario em que posicao ele esta.

**Importante**: A posicao mostrada sera relativa apenas as demandas do usuario (pois o filtro `created_by` ja limita). Para mostrar a posicao real na fila global, seria necessaria uma query adicional, mas isso esta fora do escopo atual.

### O que NAO muda

- O componente `DemandCard` ja renderiza corretamente sem acoes de admin quando `isMaster={false}` (o menu dropdown so aparece para masters)
- Os cards ja mostram todos os detalhes (tipo, descricao, campos, data, comentarios, tag de atraso)
- O `DemandDetailDialog` continua funcionando ao clicar
- O botao flutuante (FAB) para criar demandas continua no mesmo lugar

### Limpeza

- O componente `UserDemandsList.tsx` podera ser removido, pois nao sera mais utilizado
- Remover o import correspondente do `Index.tsx`
