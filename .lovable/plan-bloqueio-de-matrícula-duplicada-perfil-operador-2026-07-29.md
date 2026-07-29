# Bloqueio de MATRÍCULA duplicada (perfil operador)

Ao preencher o campo MATRÍCULA no formulário de nova demanda, o valor será normalizado e verificado no banco. Se já existir uma demanda com a mesma matrícula (em qualquer etapa: Enviadas, Em Andamento ou Finalizada), o operador é avisado de quem abriu e quando, e o botão Publicar fica bloqueado.

## Comportamento

1. **Normalização automática**: ao digitar/sair do campo MATRÍCULA, todos os espaços em branco (inicio, fim e internos) são removidos do valor.
2. **Verificação de duplicidade**: com o campo preenchido, o app consulta o banco por outras demandas que já usaram a mesma matrícula.
   - Considera demandas em qualquer status (open / in_progress / completed), sem limite de data.
3. **Aviso ao operador**: se houver duplicata, aparece um alerta vermelho abaixo do campo, por exemplo:
   > Matrícula já solicitada por Maria Silva em 12/05/2026 às 14:32.
   
   Datas e horas em formato pt-BR.
4. **Bloqueio**: o botão "Publicar" fica desabilitado enquanto a matrícula duplicada estiver no campo. Uma verificação final acontece também no clique em Publicar (evita corrida entre dois operadores), exibindo toast de erro e cancelando o envio.
5. Enquanto a checagem roda, um indicador discreto de "verificando..." aparece no campo.

## Detalhes técnicos

- Campo alvo identificado por rótulo: `demand_type_fields.label` normalizado igual a "matricula" (sem acento/caixa), hoje o campo `MATRÍCULA` do tipo IMPORTAÇÃO. Assim funciona também se outros tipos criarem um campo com o mesmo nome.
- Novo hook `src/hooks/useMatriculaCheck.tsx`:
  - recebe o valor normalizado e o(s) `field_id` de matrícula;
  - consulta `demand_field_values` com join obrigatório em `demands`:
    `select("value, demands!inner(id, status, created_at, created_by, profiles:profiles!demands_created_by_fkey(name))")`
    filtrando `.in("field_id", matriculaFieldIds)` e `.ilike("value", valorNormalizado)`;
  - ordena pelo `created_at` mais recente e retorna `{ checking, duplicate }` com nome do criador e data;
  - debounce de ~400ms para não consultar a cada tecla.
- `src/components/DemandInput.tsx`:
  - `handleFieldChange` remove espaços (`value.replace(/\s+/g, "")`) quando o campo é de matrícula;
  - exibe o aviso abaixo do input e inclui `!duplicate` em `validateForm()`;
  - `handleSubmit` refaz a checagem antes de chamar `onSubmit`.
- Formatação com `date-fns` + locale `ptBR` (`dd/MM/yyyy 'às' HH:mm`).
- Sem alterações de banco de dados; as políticas atuais já permitem a leitura necessária.

## Observação

Valores antigos gravados com espaços internos não casam exatamente com o valor normalizado; a comparação usa `ilike` (sem diferenciar maiúsculas/minúsculas). Se preferir, posso normalizar também os registros já existentes numa migração.
