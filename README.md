# madden-solution

## Architecture

```mermaid
graph TD
    subgraph Frontend
        React[React App]
        TanQuery[TanStack Query]
        WebSocket[WebSocket Client]
        Charts[Recharts]
        MUI[Material UI]
    end

    subgraph Backend
        Chi[Chi Router]
        Handler[Handlers]
        Sim[Sales Simulator]
        WS[WebSocket Server]
        PG_Listen[PostgreSQL Listener]
    end

    subgraph Database
        PostgreSQL
        Redis[Redis Cache]
    end

    React --> TanQuery
    TanQuery --> Chi
    WebSocket --> WS
    WS --> PG_Listen
    Chi --> Handler
    Handler --> PostgreSQL
    Handler --> Redis
    Sim --> PostgreSQL
    PostgreSQL -- Notifications --> PG_Listen
```
## Technical Implementation

### Frontend
- **State Management & Data Fetching**
  - TanStack Query for client-side cache management and data synchronization
  - Axios for HTTP requests
  - WebSocket for real-time sales updates
  - React hooks for local state

- **UI Components**
  - Material UI (MUI) for component library
  - Recharts for data visualization
  - Custom components for specific features

### Backend
- **API Layer**
  - Chi router for HTTP routing
  - WebSocket handler for real-time updates
  - PostgreSQL LISTEN/NOTIFY for event handling

- **Data Layer**
  - PostgreSQL for persistent storage
  - Redis for optional caching
  - Sales simulation worker
