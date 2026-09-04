# flow-editor

Versioniertes Angular-Paket für die Flow-Editor-Oberfläche und ihre Feature-Route.

Die Route `/editor` speichert den ausgewählten Flow und den aktuell bearbeiteten Knoten im gemeinsamen Ansichtslink.
Nach dem Öffnen des Links werden Registry und Flow-Liste geladen, bevor die Auswahl wiederhergestellt wird. Nicht
gespeicherte Änderungen an der Flow-Definition werden bewusst nicht in die URL übernommen.

Die folgenden Befehle werden aus dem Verzeichnis `frontend/` ausgeführt:

```bash
npm run build:flow-editor
npx ng test flow-editor --watch=false
```
