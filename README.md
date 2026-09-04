# flow-ui-prototype

Vollständig lauffähiger End-to-End-Prototyp einer deklarativen, benutzerkonfigurierbaren UI-Flow-Engine mit Spring Boot (Backend) und Angular (Frontend).

## Modulare Architektur

Backend und Frontend sind als getrennt baubare, versionierte Artefakte organisiert:

| Fachmodul | Backend-Artefakt | Frontend-Paket | Verantwortung |
| --- | --- | --- | --- |
| Flow-Plattform | `com.flowprototype:flow-platform` | `flow-platform` | Flow-Verträge, Registry, Validierung, Persistenz, Engine und Renderer |
| Patienten-Workflow | `com.flowprototype:patient-workflow` | `patient-workflow` | Stations-/Patientendaten und zugehörige Widgets |
| Terminplanung | `com.flowprototype:appointments` | `appointments` | Termin-API, Termin-Widget und Feature-Route |
| Flow-Editor | `com.flowprototype:flow-editor` | `flow-editor` | Flow-Management-API und Editor-Oberfläche |

`backend/application` und die Angular-Anwendung unter `frontend/src` sind ausschließlich Composition Hosts. Sie wählen die einzubindenden Module aus, liefern Demo-Seed-Daten und stellen die gemeinsame Navigation bereit.

Frontend-Module beschreiben ihre Flow-Komponenten in einem versionierten `*.components.json`-Manifest und registrieren dynamische Komponenten über den Multi-Provider `FLOW_WIDGET`. Das Manifest wird beim Paketbau mit ausgeliefert und von den korrespondierenden Backend-Modulen über `ComponentDescriptorProvider` in die Registry geladen. Dadurch verwenden Renderer, Backend-Validierung und Editor dieselbe Metadatenquelle.

Jedes `pom.xml` beziehungsweise `projects/*/package.json` enthält eine eigene Artefaktversion. Abhängigkeiten zwischen Modulen referenzieren explizite Versionen und können bei Releases einzeln angehoben werden.

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
mvn -pl application -am package
java -jar application/target/application-1.0.0.jar
```

### Module einzeln bauen

```bash
mvn test package
mvn -pl flow-platform -am test package
mvn -pl patient-workflow -am test package
mvn -pl appointments -am test package
mvn -pl flow-editor -am test package
mvn -pl application -am test package
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
npm run build:flow-platform
npm run build:patient-workflow
npm run build:appointments
npm run build:flow-editor
```

## Frontend-Module

Die Shell stellt nur die gemeinsame Toolbar und die Composition-Routen bereit. Sie lädt die separat gebauten Pakete lazy:

- Benutzer-UI: `/runtime`
- Stationsbezogene Terminplanung: `/appointments`
- Editor: `/editor`

Weitere Module können eigene Routen, API-Clients und Widget-Provider exportieren, ohne die Flow-Plattform zu ändern.
Die Berechtigungen eines Flow-Knotens werden im Editor als kommaseparierte Werte konfiguriert.
Das Terminplanungsmodul verwendet beispielhaft `APPOINTMENTS_READ`; die Berechtigungen sind im Prototyp clientseitig gemockt.

### Komponenten-Metadaten

Jedes Frontend-Fachmodul liefert sein Manifest als Paket-Asset aus und verweist in `package.json` über `flowComponents` darauf. Das Manifest enthält Schema-, Modul- und Modulversionsangaben sowie IDs, Container-Eigenschaft, typisierte Inputs und Outputs aller registrierten Flow-Komponenten. Die Backend-Fachmodule übernehmen dieselben Dateien beim Maven-Build nach `META-INF/flow-components`; fehlende, falsch zugeordnete oder intern doppelte Metadaten verhindern den Start. `GET /api/flow-registry` stellt die zusammengeführte Beschreibung für Validierung und Editor bereit.

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

### Patienten-Workflow
- `GET /api/wards`
- `GET /api/wards/{id}/patients`
- `GET /api/patients/{id}`
- `GET /api/patients/{id}/findings`
- `GET /api/patients/{id}/orders`
- `GET /api/patients/{id}/transfusions`

### Terminplanung
- `GET /api/wards/{id}/appointments`
- `POST /api/wards/{id}/appointments`

## Fehlende Produktionsreife (bewusst)

- Authentifizierung/Autorisierung
- Rechteprüfung auf fachliche Daten und Konfiguration
- Publishing/Versionierung von Flows
- Rollenzuweisung je Flow
- Migration bestehender Flows bei Registry-Änderungen
- i18n/Lokalisierung
- Auditierung/Änderungshistorie
