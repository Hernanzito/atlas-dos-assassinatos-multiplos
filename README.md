# Atlas dos Assassinatos Múltiplos

Mapa interativo para explorar a distribuição territorial de assassinatos múltiplos registrados no Equador entre 2023 e 2025.

## Recursos

- 425 ocorrências consolidadas e 1.640 vítimas;
- filtros por ano, província, área e número mínimo de vítimas;
- busca por cantão, distrito, circuito e subcircuito;
- detalhes territoriais de cada ocorrência;
- visualização responsiva construída com Next.js, React, Leaflet e OpenStreetMap.

Nove ocorrências sem coordenadas válidas permanecem contabilizadas nos indicadores, mas não aparecem como pontos no mapa.

## Executar localmente

```bash
pnpm install
pnpm dev
```

## Produção

```bash
pnpm build
pnpm start
```

Cada envio para a branch `main` publica automaticamente a versão estática no GitHub Pages.
