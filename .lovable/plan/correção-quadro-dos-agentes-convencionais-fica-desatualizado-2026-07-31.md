# Correção: quadro dos agentes convencionais fica desatualizado

Sim, há bugs reais. O tempo real (realtime) está ativo na tabela `demands` (confirmado no banco: a tabela está na publicação `supabase_realtime`), então o problema não é o banco — é como o app assina e recupera os eventos.

## O que está errado hoje

1. **Janela cega na inicialização**: a busca inicial das demandas dispara ao mesmo tempo que o canal de tempo real é criado. Tudo que acontece entre a busca e o momento em que o canal fica realmente conectado (`SUBSCRIBED`) é perdido para sempre — o card só aparece se a pessoa recarregar.
2. **Sem recuperação quando a conexão cai**: se o notebook dorme, o Wi‑Fi oscila ou o websocket expira, o canal entra em erro/timeout e nada é feito. O quadro congela silenciosamente até o F5. Esse é exatamente o sintoma relatado.
3. **Sem atualização ao voltar para a aba**: não existe recarga quando a aba volta a ficar visível ou quando a internet retorna.
4. **Troca de canal no meio do carregamento**: o papel do usuário (`isMaster`) começa como `false` e o `user.id` começa nulo enquanto a autenticação carrega. Isso faz a assinatura ser criada, destruída e recriada, ampliando a janela cega do item 1.
5. **Atualização de card inexistente é descartada**: quando chega um UPDATE de uma demanda que não está na lista local (porque o INSERT foi perdido), a alteração é ignorada em vez de recarregar. O desvio se acumula ao longo do dia.
6. **Limite "hoje" congelado**: o intervalo do dia é calculado uma única vez. Quem deixa a tela aberta na virada da meia‑noite continua vendo a lista do dia anterior.

## O que será feito

- Só criar o canal e buscar dados depois que autenticação e papel do usuário terminarem de carregar (evita assinaturas descartadas).
- Rebuscar as demandas no callback de `subscribe()` quando o status for `SUBSCRIBED`, fechando a janela cega.
- Tratar `CHANNEL_ERROR`, `TIMED_OUT` e `CLOSED`: reconectar com espera progressiva e rebuscar ao reconectar.
- Rebuscar quando a aba volta a ficar visível (`visibilitychange`) e quando o navegador volta a ficar online.
- Rede de segurança: rebusca periódica leve (a cada ~60s) enquanto a aba está visível.
- No evento UPDATE, se a demanda não existir na lista local, fazer rebusca em vez de descartar.
- Recalcular o recorte do dia a cada busca (já acontece) e adicionar rebusca na virada do dia para telas deixadas abertas.

## Detalhes técnicos

Arquivo principal: `src/hooks/useDemands.tsx`.

- Guardar `roleLoading`/`authLoading` (via `useUserRole`/`useAuth`) e retornar cedo do `useEffect` enquanto carregam; `src/pages/Index.tsx` continua mostrando o loader.
- `channel.subscribe((status) => ...)` com `fetchDemands()` em `SUBSCRIBED` e reconexão via `supabase.removeChannel` + recriação em `CHANNEL_ERROR`/`TIMED_OUT`/`CLOSED`, com backoff (1s, 2s, 5s, 10s, máx 30s).
- Listeners de `document.visibilitychange` e `window.online` chamando `fetchDemands()`, removidos no cleanup.
- `setInterval` de 60s com verificação de `document.visibilityState === "visible"`, limpo no cleanup.
- Manter `fetchDemands` estável com `useCallback` e usar um ref para evitar recriar o canal a cada mudança de identidade da função.

Nenhuma alteração de banco, RLS ou regra de negócio.
