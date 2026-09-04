# Flow UI Frontend Workspace

Die Angular-Workspace besteht aus einer dünnen Demo-Shell und unabhängig versionierten Bibliotheken:

- `flow-platform`: Flow-Verträge, HTTP-Client, Engine, Berechtigungen, Ansichtsrouter und dynamischer Renderer
- `patient-workflow`: Patienten-API, Runtime-Route und Patienten-Widgets
- `appointments`: Termin-API, Route und Termin-Widget
- `flow-editor`: Editor-Route und Editor-Oberfläche

Die Pakete registrieren Widgets über `provideFlowWidget`; der Renderer importiert keine Fachkomponenten. Die Basis-URL kann im Host mit `provideFlowUiApiBaseUrl` konfiguriert werden.

## Routing und speicherbare Ansichten

Die Shell stellt die Modulrouten `/runtime`, `/appointments` und `/editor` bereit. Innerhalb dieser Routen schreibt der
`ViewRouterService` den aktuellen UI-Zustand in den Query-Parameter `view`. Der Wert ist versioniert, Base64URL-kodiert
und an den aktuellen Routenpfad gebunden. Änderungen ersetzen den aktuellen Browser-History-Eintrag, damit
Flow-Transitionen und Tabwechsel die Zurück-Historie des Browsers nicht mit technischen Zwischenschritten füllen.

Runtime-Module speichern Flow-ID, Knoten, Kontext und Flow-Historie. Tab-Container speichern zusätzlich aktive und
dynamische Tabs unter ihrer stabilen Flow-Knoten-ID. Der Editor speichert nur die aktuelle Flow- und Knotenauswahl;
nicht gespeicherte Formularänderungen werden nicht in die URL geschrieben.

Der URL-Zustand ist nicht verschlüsselt. Module dürfen dort nur JSON-serialisierbare Navigationsdaten und keine
Zugangsdaten oder Geheimnisse ablegen.

## Entwicklung

```bash
npm start
```

Die Befehle verwenden das vorhandene `node_modules`. Falls eine lokale Installation fehlt, ist
`npm install --offline` zu verwenden.

## Builds

```bash
npm run build
npm run build:flow-platform
npm run build:patient-workflow
npm run build:appointments
npm run build:flow-editor
```

Die Einzel-Builds erstellen veröffentlichbare Pakete unter `dist/<paket>`. Abhängige Build-Skripte bauen ihre lokalen Peer-Pakete zuerst.

## Tests

```bash
npm test
```

Einzelne Bibliotheken können mit dem lokal installierten Angular CLI getestet werden:

```bash
npx --offline ng test flow-platform --watch=false
npx --offline ng test patient-workflow --watch=false
npx --offline ng test appointments --watch=false
npx --offline ng test flow-editor --watch=false
```
