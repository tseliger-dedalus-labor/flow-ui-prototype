# appointments

Versioniertes Angular-Fachpaket für Termin-API, Termin-Widget und Feature-Route.

Die Route `/appointments` verwendet denselben zustandsfähigen `ToolRuntimePage` wie der Patienten-Workflow. Ein
gespeicherter Ansichtslink stellt den Termin-Flow, den aktiven Knoten, Kontext, Rücksprunghistorie und enthaltene
Tab-Container wieder her. Nur Flows, die weiterhin dem `AppointmentTool` zugeordnet sind, werden übernommen.

Die folgenden Befehle werden aus dem Verzeichnis `frontend/` ausgeführt:

```bash
npm run build:appointments
npx ng test appointments --watch=false
```
