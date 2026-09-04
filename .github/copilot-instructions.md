# Repository instructions

- Run backend Maven builds and tests in offline mode with `mvn -o`.
- Do not resolve or download dependencies during a build unless the user explicitly requests it.
- Use locally installed frontend dependencies; if an npm install is necessary, use npm's offline mode.
