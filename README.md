# DevOps Kubernetes Demo

Aplicación web local para una demostración técnica del recorrido:

`Código → Git → GitHub → GitHub Actions → CodeQL → Docker → Trivy → Kubernetes → Rolling Update → Logs → Métricas → HPA`

Esta aplicación Node.js es estable, sin estado y puede ejecutarse en Docker o en Kubernetes.

## Qué incluye

| Área | Componente | Archivo |
| --- | --- | --- |
| Aplicación | API REST Node.js + Express | `src/` |
| Pruebas | Tests automatizados (node:test + supertest) | `test/` |
| Contenedor | Imagen multi-stage, usuario no-root, healthcheck | `Dockerfile` |
| CI | Build + Lint + Test en cada PR | `.github/workflows/ci.yml` |
| Empaquetado | Build y push de imagen a GHCR | `.github/workflows/docker-publish.yml` |
| Seguridad (SAST) | CodeQL — GitHub Advanced Security | `.github/workflows/codeql.yml` |
| Despliegue | Deploy a Kubernetes con environment/aprobación | `.github/workflows/deploy.yml` |
| Cadena de suministro | Dependabot (npm, actions, docker) | `.github/dependabot.yml` |
| Kubernetes | Deployment, Service, Ingress | `k8s/` |

## La API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/` | Info del servicio |
| `GET` | `/health` | Liveness/readiness |
| `GET` | `/api/products` | Lista de productos |
| `GET` | `/api/products/:id` | Producto por id |

También expone `/version`, `/info` y `/cpu` para la demo de ciclo de vida.

## Arquitectura

```text
Browser
   |
   v
Express Application
   |
   +-- /
   +-- /health
   +-- /version
   +-- /info
   +-- /cpu
   +-- /api/products
   +-- /api/products/:id
```

La interfaz consume `/health` y `/info` cada 3 segundos, sin recargar la página. La versión visible sale únicamente de `APP_VERSION`.

## Prerrequisitos

```text
Node.js 18 o superior
npm
Docker Desktop
```

## Instalación

```bash
npm install
```

La aplicación funciona sin archivo `.env`. Las variables (`APP_NAME`, `APP_VERSION`, `APP_ENVIRONMENT`, `PORT`) se toman del entorno del proceso, del contenedor o del Deployment de Kubernetes. Si no se definen, usa valores por defecto.

## Ejecutar

```bash
npm start
```

La aplicación escucha en `0.0.0.0:3000`.

Abre [http://localhost:3000](http://localhost:3000).

## Ejecutar en desarrollo

```bash
npm run dev
```

Reinicia el proceso cuando cambian los archivos de `src/`.

## Lint y pruebas

```bash
npm run lint
npm test
```

Las pruebas usan `node:test` con `supertest`. Terminan con código `0` cuando todo es correcto.

## Ejecutar con Docker

Construye la imagen:

```bash
docker build -t devops-kubernetes-demo:1.0.0 .
```

Inicia el contenedor:

```bash
docker run --rm -p 3000:3000 --name devops-demo devops-kubernetes-demo:1.0.0
```

Abre [http://localhost:3000](http://localhost:3000). Dentro del contenedor el ambiente es `docker` y la versión sigue saliendo de `APP_VERSION`.

Para ver la versión 2 sin reconstruir la imagen:

```bash
docker run --rm -p 3000:3000 -e APP_VERSION=2.0.0 --name devops-demo devops-kubernetes-demo:1.0.0
```

Detén el contenedor con Ctrl+C. Docker envía `SIGTERM` y la aplicación se cierra de forma ordenada.

## Kubernetes

Docker Desktop trae un clúster local. Actívalo en **Settings → Kubernetes → Enable Kubernetes** y espera a que quede en ejecución.

El Deployment usa la imagen publicada en GitHub: `ghcr.io/sebas1015h/devops-kubernetes-demo:1.0.0`. `imagePullPolicy` es `IfNotPresent`. El runner descarga esa imagen desde GHCR y la importa al clúster. Si el nodo ya la tiene, no la vuelve a descargar.

Detén el contenedor suelto si todavía usa el puerto 3000 y despliega:

```bash
kubectl apply -f k8s/
kubectl get pods
kubectl get service devops-demo
kubectl get ingress devops-demo
```

Abre [http://localhost:3000](http://localhost:3000). El ambiente pasa a `kubernetes` y el hostname es el nombre del Pod. Hay dos réplicas, así que al refrescar puede responder uno u otro.

`/health` es la prueba de vida y de disponibilidad. Para ver los logs de un Pod:

```bash
kubectl logs -l app=devops-demo --tail=20
```

La versión sigue saliendo de `APP_VERSION`, dentro de `k8s/deployment.yaml`.

## Endpoints

### `GET /`

Con `Accept: application/json` responde info del servicio:

```json
{
  "service": "DevOps Kubernetes Demo",
  "version": "1.0.0",
  "environment": "local",
  "endpoints": ["/health", "/version", "/info", "/cpu", "/api/products", "/api/products/:id"]
}
```

Sin ese header (navegador), sirve el dashboard HTML.

### `GET /health`

Comprobación ligera para probes y pipelines.

```json
{
  "status": "healthy",
  "application": "DevOps Kubernetes Demo",
  "version": "1.0.0",
  "timestamp": "2026-09-23T15:30:00.000Z"
}
```

Responde `200`.

### `GET /api/products`

```json
{
  "products": [
    {
      "id": "creditos",
      "name": "Créditos",
      "description": "Financiamiento cercano para impulsar el crecimiento de personas y negocios."
    }
  ]
}
```

### `GET /api/products/:id`

Detalle de un producto. Si no existe, responde `404`.

### `GET /version`

```json
{
  "application": "DevOps Kubernetes Demo",
  "version": "1.0.0",
  "environment": "local"
}
```

`version` proviene de `APP_VERSION`.

### `GET /info`

```json
{
  "application": "DevOps Kubernetes Demo",
  "version": "1.0.0",
  "environment": "local",
  "hostname": "demo-app",
  "nodeVersion": "v22.0.0",
  "platform": "linux",
  "uptime": 120
}
```

`hostname` usa `os.hostname()`, así se puede identificar el Pod que responde.

### `GET /cpu`

Genera carga de CPU durante un intervalo corto y finito. Sin parámetro dura `300` ms. Con `duration` acepta un entero positivo y nunca trabaja más de `2000` ms.

```json
{
  "message": "CPU load generated",
  "duration": 500,
  "hostname": "demo-app"
}
```

Un valor no numérico responde `400`.

### Errores

Ruta inexistente, `404`:

```json
{
  "error": "Route not found"
}
```

Error interno, `500`:

```json
{
  "error": "Internal Server Error"
}
```

La respuesta no incluye el stack trace.

## Variables de entorno

| Variable | Predeterminado | Uso |
| --- | --- | --- |
| `APP_NAME` | `DevOps Kubernetes Demo` | Nombre mostrado por la API y el dashboard |
| `APP_VERSION` | `1.0.0` | Versión de la aplicación. Cámbiala a `2.0.0` para la demo de rolling update |
| `APP_ENVIRONMENT` | `local` | Ambiente mostrado en `/version`, `/info` y el dashboard |
| `PORT` | `3000` | Puerto HTTP |

Ejemplo para mostrar la versión 2 sin modificar código:

```bash
APP_VERSION=2.0.0 npm start
```

En PowerShell:

```powershell
$env:APP_VERSION="2.0.0"; npm start
```

## Pruebas rápidas

```bash
curl http://localhost:3000/health
```

```bash
curl -H "Accept: application/json" http://localhost:3000/
```

```bash
curl http://localhost:3000/api/products
```

```bash
curl http://localhost:3000/version
```

```bash
curl http://localhost:3000/info
```

```bash
curl "http://localhost:3000/cpu?duration=500"
```

## Logs y cierre

Cada request escribe una línea:

```text
[2026-09-23T15:30:00Z] GET /health 200 hostname=demo-app
```

`SIGTERM` y `SIGINT` detienen la aceptación de conexiones nuevas y cierran el servidor HTTP antes de salir. Ese comportamiento es el que usará después un rolling update de Kubernetes.

## Preparación para Docker y Kubernetes

- Escucha en `0.0.0.0`.
- El puerto sale de `PORT`.
- No depende de `localhost` dentro de la aplicación.
- `/health` está listo para `livenessProbe` y `readinessProbe`.
- La aplicación no guarda estado ni archivos locales.
- El hostname identifica el proceso o Pod que responde.
- `/cpu` permite provocar carga para un HPA.
- El cierre controlado responde a `SIGTERM`.
