# flow-platform

Versioniertes Angular-Basispaket für Flow-Verträge, HTTP-Zugriff, Engine, Berechtigungen, Ansichts-Routing und den
erweiterbaren Renderer.

## Ansichts-Routing

`ViewRouterService` verwaltet voneinander getrennte Zustandsbereiche innerhalb des Query-Parameters `view`:

- `read(scope)` liefert den unbekannten, vom aufrufenden Modul zu validierenden Zustand.
- `write(scope, state)` aktualisiert einen JSON-serialisierbaren Zustandsbereich.
- `clearByPrefix(prefix)` entfernt zusammengehörige Bereiche, beispielsweise alte Tab-Zustände beim Start eines neuen
  Flows.

Der gesamte Zustand wird versioniert und Base64URL-kodiert. Die Kodierung verkürzt die URL und verhindert zusätzliche
Prozentkodierung, stellt aber keine Verschlüsselung dar. Alte Links mit dem zuvor verwendeten JSON-Format bleiben
lesbar. URL-Änderungen verwenden `replaceUrl`, sodass die Browser-Historie nicht für jeden UI-Schritt erweitert wird.

`FlowEngineService.state$` und `snapshot()` liefern den serialisierbaren Runtime-Zustand aus aktivem Knoten, Kontext
und Rücksprunghistorie. `initialize(definition, restoredState)` stellt ihn nach dem erneuten Laden der serverseitigen
Flow-Definition wieder her und verwirft Verweise auf nicht mehr vorhandene Knoten.

Container-Widgets können über `EmbeddedFlowContainer.flowContainerId` eine stabile ID erhalten. Der Renderer setzt
diese ID auf die ID des zugehörigen Flow-Knotens, damit containerlokaler Zustand eindeutig in der URL abgelegt werden
kann.

Die folgenden Befehle werden aus dem Verzeichnis `frontend/` ausgeführt:

```bash
npm run build:flow-platform
npx --offline ng test flow-platform --watch=false
```
