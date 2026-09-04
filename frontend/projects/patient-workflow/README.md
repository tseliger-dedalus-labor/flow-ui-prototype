# patient-workflow

Versioniertes Angular-Fachpaket für Patienten- und Stationsdaten, Runtime-Route und zugehörige Flow-Widgets.

Die Route `/runtime` verwendet den gemeinsamen `ToolRuntimePage` und stellt aus dem Ansichtslink den ausgewählten
Webclient-Flow, dessen aktiven Knoten, Kontext und Rücksprunghistorie wieder her.

Das Widget `TabPanelComponent` speichert seinen Zustand unter der vom Renderer zugewiesenen Flow-Knoten-ID. Damit
werden sowohl der aktive statische Tab als auch beliebig viele dynamisch geöffnete Auftrag-Tabs inklusive der für ihre
Darstellung notwendigen Knoten-Inputs wiederhergestellt. Beim Schließen oder Wechseln eines Tabs wird derselbe
URL-Zustand aktualisiert.

Die folgenden Befehle werden aus dem Verzeichnis `frontend/` ausgeführt:

```bash
npm run build:patient-workflow
npx --offline ng test patient-workflow --watch=false
```
