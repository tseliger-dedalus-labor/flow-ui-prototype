# Flow UI Frontend Workspace

Die Angular-Workspace besteht aus einer dünnen Demo-Shell und unabhängig versionierten Bibliotheken:

- `flow-platform`: Flow-Verträge, HTTP-Client, Engine, Berechtigungen und dynamischer Renderer
- `patient-workflow`: Patienten-API, Runtime-Route und Patienten-Widgets
- `appointments`: Termin-API, Route und Termin-Widget
- `flow-editor`: Editor-Route und Editor-Oberfläche

Die Pakete registrieren Widgets über `provideFlowWidget`; der Renderer importiert keine Fachkomponenten. Die Basis-URL kann im Host mit `provideFlowUiApiBaseUrl` konfiguriert werden.

## Entwicklung

```bash
npm install
npm start
```

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
