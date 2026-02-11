

# Plano: Botao Flutuante para Criar Demanda (estilo Gmail Compose)

## Resumo

Substituir o formulario inline (`DemandInput`) por um botao flutuante `+` no canto inferior direito da tela. Ao clicar, abre um painel/modal compacto ancorado no canto inferior direito (igual ao Gmail quando clicamos em "Escrever"), com o mesmo formulario de criacao de demanda.

## O que muda para o usuario

- O formulario que hoje ocupa espaco fixo no topo da pagina desaparece
- Um botao redondo com `+` fica sempre visivel no canto inferior direito
- Ao clicar, um painel compacto (~400px de largura) aparece no canto inferior direito com o formulario
- O painel tem um header com titulo "Nova Demanda" e um botao de fechar/minimizar
- Apos publicar com sucesso, o painel fecha automaticamente

## Arquivos a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/DemandInput.tsx` | Refatorar para ser o conteudo interno do painel flutuante. Adicionar estado `isOpen`, botao FAB, e o wrapper do painel. Apos submit bem-sucedido, fechar o painel. |
| `src/pages/Index.tsx` | Remover a renderizacao inline do `DemandInput` no fluxo do layout. Renderizar o `DemandInput` fora do fluxo (posicao fixa), apenas para usuarios nao-master. Remover o padding condicional `pt-4`. |

## Detalhes tecnicos

### Botao flutuante (FAB)
- Posicao: `fixed bottom-6 right-6`
- Estilo: botao redondo, `w-14 h-14`, com icone `Plus` do lucide-react
- `z-index: 50` para ficar acima do conteudo
- Sombra para destaque: `shadow-lg`
- Escondido quando o painel esta aberto

### Painel flutuante (Compose Window)
- Posicao: `fixed bottom-6 right-6`
- Largura: `w-[420px]`
- Altura: auto com `max-h-[80vh]` e `overflow-y-auto`
- Borda arredondada, sombra forte (`shadow-2xl`)
- Header com "Nova Demanda" + botao X para fechar
- Corpo: formulario existente do `DemandInput`
- Animacao de entrada: scale + fade in (CSS)
- `z-index: 50`

### Fluxo
1. Usuario clica no `+`
2. Painel abre com animacao suave
3. Usuario preenche e clica "Publicar"
4. Apos sucesso, painel fecha e formulario reseta
5. Usuario pode fechar manualmente clicando no X

