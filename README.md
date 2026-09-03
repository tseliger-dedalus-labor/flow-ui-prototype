# flow-ui-prototype

Vollständig lauffähiger End-to-End-Prototyp einer deklarativen, benutzerkonfigurierbaren UI-Flow-Engine mit Spring Boot (Backend) und Angular (Frontend).

## Architektur

- **Component Registry** (Backend): zentrale Deskriptoren für Komponenten mit
  - `id`, `title`, `container`
  - Inputs (`required`, semantischer Typ, erlaubte Enum-Werte)
  - Outputs (Payload-Felder mit semantischen Typen)
- **FlowDefinition**: gerichteter Graph aus `FlowNode`s mit
  - `componentId`
  - `inputBindings` (`STATIC` oder `CONTEXT`)
  - `children` (nur für Container-Komponenten)
  - `transitions` (`onOutput` → `targetNodeId` + `contextMapping`)
- **FlowEngineService** (Frontend): hält aktuellen Knoten, akkumulierten Context (`wardId`, `patientId`) und Zurück-Navigation.
- **FlowRendererComponent** (Frontend): erzeugt Komponenten dynamisch, setzt Inputs, hört Outputs, führt Transitionen aus und rendert Kindknoten rekursiv.

## Datenmodell (Backend)

Relationale Metadaten + CLOB/JSON:

- Tabelle `flows`
  - `id` (PK)
  - `name`
  - `active`
  - `definition_json` (JSON als CLOB)

## Beispiel-Flow (kommentiert)

```json
{
  "id": "flow-normal",
  "name": "Standardfluss",
  "entryNodeId": "wards",
  "nodes": [
    {
      "id": "wards",
      "componentId": "ward-list",
      "transitions": [
        {
          "onOutput": "wardSelected",
          "targetNodeId": "patients",
          "contextMapping": { "wardId": "$event.wardId" }
        }
      ]
    },
    {
      "id": "patients",
      "componentId": "patient-list",
      "inputBindings": {
        "wardId": { "source": "CONTEXT", "contextKey": "wardId" },
        "mode": { "source": "STATIC", "staticValue": "normal" }
      }
    }
  ]
}
```

## Backend starten (`backend/`)

```bash
cd backend
mvn spring-boot:run
```

### Build & Tests

```bash
mvn test package
```

## Frontend starten (`frontend/`)

```bash
cd frontend
npm install
npm start
```

### Build

```bash
npm run build
```

## Editor-Workflow (`/editor`)

1. Flow auswählen
2. Knoten auswählen
3. Komponente wählen
4. Input-Bindings (STATIC/CONTEXT) setzen
5. Transitionen und Context-Mappings bearbeiten
6. Kindknoten für Container zusammenstellen
7. Live-Validierung prüfen
8. Speichern via Backend

## REST-API-Übersicht

### Flow/Registry
- `GET /api/flow-registry`
- `GET /api/flows`
- `GET /api/flows/{id}`
- `GET /api/flows/effective`
- `POST /api/flows`
- `PUT /api/flows/{id}`
- `POST /api/flows/{id}/validate`

### Mock-Daten
- `GET /api/wards`
- `GET /api/wards/{id}/patients`
- `GET /api/patients/{id}`
- `GET /api/patients/{id}/findings`
- `GET /api/patients/{id}/orders`
- `GET /api/patients/{id}/transfusions`

## Fehlende Produktionsreife (bewusst)

- Authentifizierung/Autorisierung
- Rechteprüfung auf fachliche Daten und Konfiguration
- Publishing/Versionierung von Flows
- Rollenzuweisung je Flow
- Migration bestehender Flows bei Registry-Änderungen
- i18n/Lokalisierung
- Auditierung/Änderungshistorie
