# flow-ui-prototype

Vollständig lauffähiger End-to-End-Prototyp einer deklarativen, benutzerkonfigurierbaren UI-Flow-Engine mit Spring Boot (Backend) und Angular (Frontend).

## Modulare Architektur

Backend und Frontend sind als getrennt baubare, versionierte Artefakte organisiert:

| Fachmodul | Backend-Artefakt | Frontend-Paket | Verantwortung |
| --- | --- | --- | --- |
| UI-Framework | – | `ui-framework` | Gemeinsame Presenter-Basen, UI-Zustände und Tool-Zuordnung |
| Flow-Plattform | `com.flowprototype:flow-platform` | `flow-platform` | Flow-Verträge, Registry, Validierung, Persistenz, Engine und Renderer |
| Patienten-Workflow | `com.flowprototype:patient-workflow` | `patient-workflow` | Stations-/Patientendaten und zugehörige Widgets |
| Terminplanung | `com.flowprototype:appointments` | `appointments` | Termin-API, Termin-Widget und Feature-Route |
| Flow-Editor | `com.flowprototype:flow-editor` | `flow-editor` | Flow-Management-API und Editor-Oberfläche |

`backend/application` und die Angular-Anwendung unter `frontend/src` sind ausschließlich Composition Hosts. Sie wählen die einzubindenden Module aus, liefern Demo-Seed-Daten und stellen die gemeinsame Navigation bereit.

Frontend-Module beschreiben ihre Flow-Komponenten in typisierten TypeScript-Definitionen und registrieren sie über den Multi-Provider `FLOW_WIDGET`. Daraus wird ein versioniertes `*.components.json`-Manifest generiert, beim Paketbau mit ausgeliefert und von den korrespondierenden Backend-Modulen über `ComponentDescriptorProvider` in die Registry geladen. Dadurch verwenden Renderer, Backend-Validierung und Editor dieselbe Metadatenquelle.

Flow-Komponenten können zusätzlich direkt an den lokalen Mock des ixserv-Typs `IxtDisplayType` gebunden werden. Der Mock spiegelt Namen und Datenbankwerte aus `Constants.XmfIxservType.IxtDisplayType`, erzeugt aber keine Abhängigkeit auf ixserv. Beim Aufbau der zentralen Komponenten-Registry bricht der Anwendungsstart ab, wenn derselbe `IxtDisplayType` mehr als einer Komponente zugeordnet wurde. Komponenten ohne Zuordnung, beispielsweise reine Layout-Komponenten, bleiben zulässig. Der ebenfalls lokal definierte `PrtType` stellt `PRTTYPE_NONE`, `PRTTYPE_ORDER`, `PRTTYPE_REPORT`, `PRTTYPE_DOCUMENT` und `PRTTYPE_TRAFU` in Backend und Frontend bereit, ohne ix.serv direkt zu importieren.

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
  "sidebarMode": "COLLAPSE",
  "nodes": [
    {
      "id": "wards",
      "componentId": "ward-list-content",
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
      "componentId": "patient-list-content",
      "sidebar": {
        "nodeId": "wards-sidebar",
        "position": "LEFT",
        "width": 280,
        "ariaLabel": "Stationsauswahl"
      },
      "inputBindings": {
        "wardId": { "source": "CONTEXT", "contextKey": "wardId" },
        "mode": { "source": "STATIC", "staticValue": "normal" }
      }
    },
    {
      "id": "wards-sidebar",
      "componentId": "ward-list-sidebar",
      "transitions": [
        {
          "onOutput": "wardSelected",
          "targetNodeId": "patients",
          "contextMapping": { "wardId": "$event.wardId" }
        }
      ]
    }
  ]
}
```

Jeder Knoten kann eine eigene `sidebar`-Konfiguration besitzen. Dadurch zeigt die Patientenliste beispielsweise die Stationsliste als Sidebar, während die Patientendetailansicht zur Patientenliste wechselt. Mit `sidebarMode: "COLLAPSE"` werden alle im Flow referenzierten Sidebars als umschaltbare Bereiche angezeigt; die zum aktiven Hauptknoten gehörende Sidebar wird automatisch geöffnet. Der Standardmodus `SINGLE` rendert weiterhin nur die aktive Sidebar. Sidebar-Inputs werden gegen den Kontext des aktiven Hauptknotens validiert; ihre Outputs und Transitionen müssen die Pflicht-Inputs ihrer Ziele typkompatibel versorgen. Eine `sidebar` auf Flow-Ebene bleibt als Fallback für bestehende Definitionen erhalten. Modus, Position, Breite, Zielknoten und ARIA-Bezeichnung sind im Flow-Editor konfigurierbar.

## Backend starten (`backend/`)

```bash
cd backend
mvn -pl application -am package
java -jar application/target/application-1.0.0.jar
```

### Module einzeln bauen

```

## Anwendung als WAR und Docker-Image bauen

Das `Dockerfile` baut zuerst das Angular-Frontend, übernimmt dessen Produktiv-Artefakte in das Spring-Boot-Backend und erzeugt daraus ein ausführbares WAR.

```bash
docker build -t flow-ui-prototype .
docker run --rm -p 8080:8080 flow-ui-prototype
```

Die Anwendung ist anschließend unter `http://localhost:8080` erreichbar. Das erzeugte WAR liegt während des Image-Builds unter `application/target/application-1.0.0.war`.bash
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
npm start
```

Falls `node_modules` noch nicht vorhanden ist, können die Abhängigkeiten mit `npm install` installiert werden.
Der Entwicklungsserver verwendet dabei `http://localhost:8080/api`; dafür muss das Backend lokal laufen. `npm run build` erzeugt dagegen den Produktions-Build mit der relativen API-URL `/api`, passend für das gemeinsame Docker- und Render-Deployment.

### Build

```bash
npm run build
npm run build:ui-framework
npm run build:flow-platform
npm run build:patient-workflow
npm run build:appointments
npm run build:flow-editor
```

## Frontend-Module

Die Shell stellt nur die gemeinsame Toolbar und die Composition-Routen bereit. Sie lädt die separat gebauten Pakete lazy:

- Webclient (`WebclientTool`, Modul `patient-workflow`): `/runtime`
- Terminplanung (`AppointmentTool`, Modul `appointments`): `/appointments`
- Editor: `/editor`

Weitere Module können eigene Routen, API-Clients und Widget-Provider exportieren, ohne die Flow-Plattform zu ändern.
Presenter für Hauptbereich und Sidebar leiten von `AContentPresenter` beziehungsweise `ASidebarPresenter` aus dem `ui-framework` ab.
Die Berechtigungen eines Flow-Knotens werden im Editor als kommaseparierte Werte konfiguriert.
Das Terminplanungsmodul verwendet beispielhaft `APPOINTMENTS_READ`; die Berechtigungen sind im Prototyp clientseitig gemockt.

### Speicherbare Ansichtslinks

Der zentrale `ViewRouterService` speichert die aktuelle Ansicht kompakt Base64URL-kodiert im Query-Parameter `view`
der jeweiligen Modulroute. Das Format ist versioniert und an den Routenpfad gebunden. Bereits erzeugte Links mit dem
früheren JSON-Format bleiben lesbar und werden bei der nächsten Zustandsänderung in das kompakte Format überführt.

Gespeichert werden:

- Runtime-Routen: ausgewählter Flow, aktiver Knoten, Flow-Kontext und Rücksprunghistorie
- Tab-Container: aktiver Tab sowie alle dynamisch geöffneten Tabs, getrennt nach Flow-Container-ID
- Editor: ausgewählter Flow und ausgewählter Knoten

Dadurch kann die aktuelle URL als Lesezeichen oder Link gespeichert werden. Beim erneuten Öffnen lädt das jeweilige
Lazy-Load-Modul zunächst seine Daten und stellt anschließend den gültigen URL-Zustand wieder her. Nicht mehr vorhandene
Flows oder Knoten werden auf die reguläre Startansicht zurückgeführt. Ein bewusst neu gestarteter Flow verwirft alte
dynamische Tab-Zustände.

Der Query-Parameter ist kodiert, aber nicht verschlüsselt. Zustandsbereiche dürfen deshalb keine Zugangsdaten oder
anderen Geheimnisse enthalten. Auch große fachliche Datenmengen gehören nicht in die URL; die Runtime speichert nur
den für die Navigation erforderlichen Kontext. Weitere Module können validierte, JSON-serialisierbare Zustandsbereiche
über `ViewRouterService.read(...)` und `ViewRouterService.write(...)` ergänzen.

### Komponenten-Metadaten

Jedes Frontend-Fachmodul definiert seine Widgets typisiert in einer exportierten `FLOW_COMPONENTS`-Liste mit `defineFlowComponent(...)`. Diese Liste ist die gemeinsame Quelle für die Angular-Provider und das generierte `*.components.json`-Manifest. Modulname und Modulversion werden aus dem jeweiligen `package.json` übernommen.

`npm run generate:components` erzeugt alle Manifeste. Der Generator prüft dabei unter anderem:

- Jede Angular-Komponente unter den in `flowComponentRoots` konfigurierten Verzeichnissen besitzt genau eine Definition.
- Alle Pflichtfelder, IDs, semantischen Typen, Inputs und Outputs sind vollständig und eindeutig.
- Die Definition enthält exakt die tatsächlichen Angular-Inputs und -Outputs.
- String-Union-Typen stimmen mit `allowedValues` und `EventEmitter`-Payloads mit den definierten Payload-Feldern überein.

Flow-Komponenten werden unter einem gemeinsamen, in `flowComponentRoots` eingetragenen `widgets`-Verzeichnis abgelegt. Vererbung von Flow-Komponenten wird bewusst abgelehnt, damit keine geerbten Angular-Bindings unbemerkt außerhalb der Definition bleiben.

Die Frontend-Modul-Builds führen die Generierung automatisch aus und schlagen bei fehlenden oder inkonsistenten Definitionen fehl. `npm run check:components` verändert keine Dateien und schlägt zusätzlich fehl, wenn eingecheckte Manifeste veraltet sind. Diese Prüfung läuft automatisch vor `npm test`.

Die generierten Manifeste bleiben versionierte Paket-Assets. Das veröffentlichte Paket verweist in `package.json` über `flowComponents` darauf. Die Backend-Fachmodule übernehmen dieselben Dateien beim Maven-Build nach `META-INF/flow-components`; fehlende, falsch zugeordnete oder intern doppelte Metadaten verhindern den Start. `GET /api/flow-registry` stellt die zusammengeführte Beschreibung für Validierung und Editor bereit.

## Editor-Workflow (`/editor`)

1. Flow auswählen
2. Knoten auswählen
3. Komponente wählen
4. Vom Component Descriptor vorbelegte Input-Bindings prüfen oder anpassen
5. Vorbelegte Output-Definitionen, Transitionen und Context-Mappings bearbeiten
6. Kindknoten für Container zusammenstellen; deren Bindings sind direkt am Tab- oder Stack-Container bearbeitbar
7. Optionalen Sidebar-Knoten, Position und Breite konfigurieren
8. Live-Validierung prüfen
9. Speichern via Backend

## REST-API-Übersicht

### Flow/Registry
- `GET /api/flow-registry`
- `GET /api/flows` (optional mit `?tool=WebclientTool` oder `?tool=AppointmentTool`)
- `GET /api/flows/{id}`
- `GET /api/flows/effective`
- `POST /api/flows`
- `PUT /api/flows/{id}`
- `POST /api/flows/{id}/validate`

### Patienten-Workflow
- `GET /api/wards`
- `GET /api/wards/{id}/patients`
- `GET /api/patients/{id}`
- `GET /api/patients/{patientId}/cases/{caseId}/findings`
- `GET /api/patients/{patientId}/cases/{caseId}/findings/{recordId}`
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
