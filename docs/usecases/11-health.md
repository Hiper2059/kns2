# Use Case: Health Check

## Overview
System health endpoint for monitoring and service checks.

### Actor
- Monitoring / System

### Main Scenario
1. GET `/health` returns service status and basic diagnostics.

### Implementation References
- Routes: [backend/routes/healthRoutes.js](backend/routes/healthRoutes.js#L1-L20)
- Controller: `backend/controllers/healthController.js`

## Server/Database Flow
- Health check: Client (monitor) `GET /health` -> Server runs quick diagnostics and may query database/connected services -> Server returns `200` with status details or `503` if critical services are down.
- Health endpoints are read-only and always served by server logic; database/state checks are performed by the server before responding.

## PlantUML — Usecase Diagram
```plantuml
@startuml
left to right direction
actor "Monitoring" as Monitoring

package "Health" {
	usecase "Check Health" as UC_CheckHealth
}

Monitoring --> UC_CheckHealth

@enduml
```

## Sequence Diagram — Health Check (PlantUML)

```plantuml
@startuml
title Health Check — Sequence Diagram
actor "Monitoring" as Monitor
participant "API" as UI
participant "Ctrl_Health" as Ctrl
participant "Ent_Database" as DB

Monitor -> UI: GET /health
UI -> Ctrl: Forward request
Ctrl -> Ctrl: Run quick diagnostics
Ctrl -> DB: Optional ping/check connection
alt Service healthy
	DB --> Ctrl: OK
	Ctrl --> UI: 200 OK + status
	UI --> Monitor: Service healthy
else Service degraded
	DB --> Ctrl: Failure / timeout
	Ctrl --> UI: 503 Service Unavailable
	UI --> Monitor: Service unhealthy
end

@enduml
```
