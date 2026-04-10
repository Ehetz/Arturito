# instrucciones.md — Para Claude

Estás siendo activado en un proyecto real que ya tiene OpenClaw funcionando. Tu trabajo es analizar lo que existe y completar los archivos `.md` de los sub-agentes con información real del entorno.

## Reglas absolutas

1. **NO borres nada.** Ni archivos, ni carpetas, ni líneas de configuración.
2. **NO muevas nada** sin autorización explícita del usuario.
3. **NO reescribas** archivos que ya tienen contenido útil — solo complementa.
4. **NO inventes** rutas, nombres de bases de datos, ni credenciales. Solo registra lo que confirmes que existe.
5. Si tienes dudas sobre algo, pregunta antes de actuar.

---

## Contexto: qué es este sistema

Este workspace tiene 4 agentes configurados en OpenClaw:

| Agente | openclaw ID | Rol |
|---|---|---|
| Orquestador | `arturito` (u otro nombre) | Planea, delega, integra |
| Archi 🗂️ | `archi` | Registry, storage, bases de datos, APIs |
| Dash 📊 | `dash` | Dashboards y visualización |
| Bob 🔧 | `bob` | Código, scripts, integraciones |

Cada agente tiene su propio workspace con archivos `.md` que definen su comportamiento. Los archivos ya tienen estructura y reglas. Tu trabajo es **completar los campos que quedaron como template** con datos reales de este entorno.

---

## Paso 1 — Analiza el entorno

Antes de editar cualquier archivo, ejecuta este análisis y toma nota de los resultados:

### 1.1 Estructura general
```bash
ls -la ~/.openclaw/
cat ~/.openclaw/openclaw.json
```
Identifica: qué agentes están registrados, qué workspace usa cada uno, el modelo configurado.

### 1.2 Workspace del orquestador
```bash
ls -la <workspace-del-orquestador>/
```
Identifica: qué proyectos activos existen, qué hay en `memory/`, si hay un `MEMORY.md`.

### 1.3 Proyectos y archivos de datos
```bash
ls <workspace>/projects/ 2>/dev/null
ls <workspace>/data/ 2>/dev/null
ls <workspace>/dashboard/ 2>/dev/null || ls <workspace>/dash/ 2>/dev/null
```
Registra: qué proyectos existen, qué archivos de datos hay, qué dashboards ya fueron creados.

### 1.4 Bases de datos
Busca archivos de configuración de DB:
```bash
find <workspace> -name "*.env" -o -name ".env" -o -name "*.json" | grep -v node_modules | grep -v ".git"
find <workspace> -name "docker-compose.yml" -o -name "docker-compose.yaml"
```
Identifica: qué bases de datos existen, hosts, puertos, nombres (nunca anotar passwords).

### 1.5 APIs conectadas
```bash
find <workspace> -name "*.env*" -o -name "config.json" -o -name "credentials*" | grep -v ".git"
cat ~/.openclaw/openclaw.json | grep -A5 "plugins"
```
Identifica: qué APIs están configuradas (CRM, Telegram, Brave, Google, etc.) y su método de auth.

### 1.6 Skills instalados
```bash
ls <workspace>/skills/ 2>/dev/null
```
Identifica: qué skills están disponibles para los agentes.

---

## Paso 2 — Completa USER.md (todos los agentes)

En cada agente (`archi`, `dash`, `bob`, `arturito`), abre el `USER.md` y rellena los campos que están como `_(fill in)_`:

- Nombre del usuario y cómo llamarlo
- Timezone
- Notas relevantes sobre el cliente (rol, dominios, preferencias)
- Contexto del proyecto activo

**No reescribas la sección "Context"** si ya tiene contenido específico del rol del agente. Solo agrega información que falte.

---

## Paso 3 — Completa TOOLS.md (todos los agentes)

Usa lo que encontraste en el análisis para rellenar cada `TOOLS.md`:

**Arturito/TOOLS.md:** SSH hosts conocidos, servicios externos en uso.

**Archi/TOOLS.md:**
- Storage roots: ruta absoluta del workspace raíz
- Databases: nombre → host:puerto/nombre-db (sin passwords)
- APIs: servicio → URL base + método de auth
- Credential locations: servicio → ruta al archivo de credencial

**Dash/TOOLS.md:** Stack preferido si se conoce, drivers de DB disponibles.

**Bob/TOOLS.md:** Versiones de runtime disponibles (Python, Node), package managers, comandos útiles del proyecto.

---

## Paso 4 — Inicializa el registry de Archi

Abre `<workspace-archi>/registry/index.md`.

Si el archivo está vacío o solo tiene el comentario inicial, registra los assets que encontraste en el análisis:

Para cada asset real que confirmaste que existe, agrega una entrada con este formato:

```
## [Nombre descriptivo]
- Type: file | dashboard | database | api | project
- Path/Location: <ruta absoluta o URL>
- Created by: <quien lo creó si se sabe, si no: "pre-existing">
- Created at: <fecha si se conoce, si no: "unknown">
- Description: <qué es y qué contiene>
- Tags: <palabras clave relevantes>
- Notes: <schema relevante, método de auth, formato, limitaciones conocidas>
```

**Regla:** Solo registra lo que verificaste que existe. Si no estás seguro, no lo registres.

---

## Paso 5 — Verifica comunicación entre agentes

Confirma que en `openclaw.json` todos los agentes tienen:
- `id` correcto
- `workspace` apuntando a la carpeta correcta
- `agentDir` apuntando a la carpeta correcta

Si alguno está mal configurado, **reporta el problema al usuario** — no lo corrijas tú solo.

---

## Paso 6 — Reporte final

Cuando termines, entrega este reporte al usuario:

```
## Reporte de implementación

### Agentes configurados
- [lista de agentes con sus IDs y workspace paths]

### USER.md completados
- [lista de agentes donde se completó]

### TOOLS.md completados
- [lista de agentes y qué se agregó]

### Registry de Archi inicializado
- Assets registrados: [número y lista]

### Campos que NO se pudieron completar
- [lista de campos que quedaron como template y por qué]

### Problemas encontrados
- [cualquier configuración incorrecta o inconsistencia]

### Siguiente paso recomendado
- [qué falta para que el sistema esté 100% operativo]
```

---

## Qué NO tocar

- `SOUL.md` de ningún agente — ya está configurado
- `AGENTS.md` de ningún agente — ya está configurado  
- `HEARTBEAT.md` — ya está configurado
- `IDENTITY.md` — ya está configurado
- `openclaw.json` — no editar sin autorización explícita
- Cualquier archivo fuera del workspace de los agentes
