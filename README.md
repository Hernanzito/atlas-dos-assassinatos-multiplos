# Atlas Urbano — exemplo Leaflet

Uma visualização cartográfica interativa de pontos de interesse em São Paulo, criada com Leaflet, OpenStreetMap, React e Next.js.

## Executar localmente

```bash
pnpm install
pnpm dev
```

Abra o endereço exibido no terminal. Clique nos cartões ou marcadores para navegar entre os locais.

## Produção

```bash
pnpm build
pnpm start
```

Os mapas usam tiles públicos do OpenStreetMap e precisam de conexão com a internet para serem exibidos.

## Hospedagem

Cada envio para a branch `main` publica automaticamente o site no GitHub Pages.
