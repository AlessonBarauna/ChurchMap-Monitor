# ChurchMap Monitor

Monitora igrejas em qualquer cidade usando dados do OpenStreetMap. Detecta automaticamente igrejas novas, fechadas ou renomeadas e notifica em tempo real.

![stack](https://img.shields.io/badge/.NET-10-512BD4?style=flat&logo=dotnet)
![stack](https://img.shields.io/badge/Angular-17-DD0031?style=flat&logo=angular)
![stack](https://img.shields.io/badge/SQLite-EF_Core-003B57?style=flat&logo=sqlite)
![stack](https://img.shields.io/badge/SignalR-realtime-00BFFF?style=flat)
![stack](https://img.shields.io/badge/OpenStreetMap-Overpass_API-7EBC6F?style=flat&logo=openstreetmap)

---

## Funcionalidades

- **Busca** — encontra todas as igrejas de uma cidade via Overpass API (OpenStreetMap)
- **Diff automático** — compara com a varredura anterior e detecta o que mudou
- **Notificações em tempo real** — SignalR envia alertas assim que uma diferença é detectada
- **Monitoramento automático** — worker em background re-varre as cidades cadastradas no intervalo configurado
- **Mapa interativo** — marcadores com clustering, cores por status (nova/fechada/normal)
- **Filtro por denominação** — chips que filtram mapa e tabela simultaneamente
- **Tabela → Mapa** — clicar em uma linha da tabela vai direto ao marcador no mapa
- **Histórico** — gráfico da evolução do número de igrejas ao longo do tempo
- **Export CSV** — exporta os dados filtrados da tabela

## Telas

| Mapa com clustering | Tabela com filtros | Histórico |
|---|---|---|
| Marcadores agrupados por zoom, cores por status, popup com detalhes | Ordenação, filtro por nome/bairro, clique vai ao mapa | Gráfico Chart.js + tabela de snapshots com variação |

## Stack

### Backend
| Tecnologia | Uso |
|---|---|
| .NET 10 / ASP.NET Core | API REST + SignalR |
| Entity Framework Core | ORM com SQLite (Code First) |
| SignalR | Notificações em tempo real |
| IHostedService | Worker de monitoramento periódico |
| Overpass API | Busca de igrejas no OpenStreetMap |
| Nominatim API | Resolução de nomes de cidades para coordenadas |

### Frontend
| Tecnologia | Uso |
|---|---|
| Angular 17 | Framework (standalone components, signals) |
| Angular Material v17 | Componentes UI |
| Leaflet.js | Mapa interativo |
| leaflet.markercluster | Agrupamento de marcadores |
| Chart.js / ng2-charts | Gráfico de histórico |
| SignalR JS Client | Notificações em tempo real |

## Estrutura do projeto

```
churchmap-monitor/
├── backend/
│   └── ChurchMap.Api/
│       ├── Controllers/        # ChurchesController, SnapshotsController, etc.
│       ├── Data/               # AppDbContext (EF Core)
│       ├── Hubs/               # MonitorHub (SignalR)
│       ├── Migrations/         # Migrations EF Core
│       ├── Models/             # Entidades e DTOs
│       └── Services/
│           ├── OverpassService.cs    # Busca na Overpass API
│           ├── SnapshotService.cs    # Salva varreduras
│           ├── DiffService.cs        # Compara snapshots
│           ├── NotificationService.cs
│           └── MonitorWorker.cs      # Background worker
└── frontend/
    └── churchmap-frontend/
        └── src/app/
            ├── core/
            │   ├── models/         # Interfaces TypeScript
            │   └── services/       # HTTP + SignalR services
            ├── features/
            │   ├── map/            # Leaflet + clustering
            │   ├── table/          # MatTable com filtros
            │   ├── history/        # Gráfico Chart.js
            │   ├── notifications/  # Timeline de notificações
            │   └── settings/       # Configuração do monitor
            └── shared/
                ├── header/         # Barra de busca
                ├── stats-bar/      # Cards de estatísticas
                └── status-bar/     # Status da varredura
```

## Como rodar

### Pré-requisitos
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org)
- [Angular CLI](https://angular.io/cli): `npm install -g @angular/cli`

### Backend

```bash
cd backend/ChurchMap.Api
dotnet run --no-launch-profile
```

A API sobe em `http://localhost:5050`. O banco SQLite é criado automaticamente na primeira execução.

### Frontend

```bash
cd frontend/churchmap-frontend
npm install
ng serve
```

O app abre em `http://localhost:4200`.

## Como usar

1. Digite o nome de uma cidade no campo de busca (ex: `Mogi das Cruzes`, `São Paulo`)
2. Aguarde a varredura — a primeira pode levar alguns segundos dependendo do tamanho da cidade
3. Explore as igrejas no **Mapa**, **Tabela** e **Histórico**
4. Na aba **Config**, cadastre cidades para monitoramento automático e defina o intervalo

## Busca na Overpass API

A busca usa 4 estratégias em cascata para garantir resultados completos mesmo quando os servidores estão instáveis:

1. **Bbox via Nominatim** _(mais rápido, ~10-15s)_ — resolve o bounding box da cidade e faz query por coordenadas
2. **area(id) via Nominatim** — usa o polígono exato do município via relation OSM
3. **relation → map_to_area** — fallback sem depender do Nominatim
4. **area por nome** — último recurso

Mirrors Overpass utilizados (tentados em sequência):
- `overpass-api.de`
- `overpass.kumi.systems`
- `overpass.openstreetmap.ru`
- `maps.mail.ru`

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/churches/search` | Busca igrejas em uma localidade |
| `GET` | `/api/snapshots?locationKey=` | Lista snapshots de uma localidade |
| `GET` | `/api/notifications` | Lista notificações |
| `PUT` | `/api/notifications/{id}/read` | Marca notificação como lida |
| `GET` | `/api/settings` | Configurações do monitor |
| `PUT` | `/api/settings` | Atualiza configurações |
| WS | `/hubs/monitor` | SignalR hub |

## Licença

MIT
