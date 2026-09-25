# DevOps Kubernetes Demo

Demostración técnica del recorrido:

`Código → Git → GitHub → GitHub Actions → CodeQL → Docker → Trivy → Kubernetes → Rolling Update → Logs`

API Node.js sin estado, lista para Docker y Kubernetes.

## Qué incluye

| Área | Componente | Archivo |
| --- | --- | --- |
| Aplicación | API REST Node.js + Express | `src/` |
| Pruebas | node:test + supertest | `test/` |
| Contenedor | Multi-stage, usuario no-root, healthcheck | `Dockerfile` |
| CI | Lint, test, CodeQL, Trivy y push a GHCR | `.github/workflows/ci.yml` |
| CD | Deploy a Kubernetes | `.github/workflows/cd.yml` |
| Cadena de suministro | Dependabot (npm, actions, docker) | `.github/dependabot.yml` |
| Kubernetes | Deployment, Service, Ingress | `k8s/` |

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/` | Info del servicio (JSON) o dashboard HTML |
| `GET` | `/health` | Liveness / readiness |
| `GET` | `/version` | Versión (`APP_VERSION`) |
| `GET` | `/info` | Datos de runtime y hostname |
| `GET` | `/cpu` | Carga de CPU controlada (demo) |
| `GET` | `/api/products` | Lista de productos |
| `GET` | `/api/products/:id` | Producto por id |

La interfaz consulta `/health` e `/info` cada 3 segundos.

## Requisitos

- Node.js 18+
- npm
- Docker Desktop (con Kubernetes activado para el deploy)

## Uso local

```bash
npm install
npm start
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npm test
```

Variables opcionales: `APP_NAME`, `APP_VERSION`, `APP_ENVIRONMENT`, `PORT`. Sin `.env`; se leen del proceso, del contenedor o del Deployment.

## Docker

```bash
docker build -t devops-kubernetes-demo:1.0.0 .
docker run --rm -p 3000:3000 --name devops-demo devops-kubernetes-demo:1.0.0
```

Para mostrar otra versión sin reconstruir:

```bash
docker run --rm -p 3000:3000 -e APP_VERSION=2.0.0 --name devops-demo devops-kubernetes-demo:1.0.0
```

## Kubernetes

Activa Kubernetes en Docker Desktop. El CD importa desde GHCR la imagen con tag del commit y aplica `k8s/`.

```bash
kubectl apply -f k8s/
kubectl get pods
kubectl get service devops-demo
kubectl logs -l app=devops-demo --tail=20
```

Abre [http://localhost:3000](http://localhost:3000). Hay dos réplicas; el hostname identifica el Pod.

## Variables de entorno

| Variable | Predeterminado | Uso |
| --- | --- | --- |
| `APP_NAME` | `DevOps Kubernetes Demo` | Nombre en API y dashboard |
| `APP_VERSION` | `1.0.0` | Versión visible (rolling update) |
| `APP_ENVIRONMENT` | `local` | Ambiente mostrado |
| `PORT` | `3000` | Puerto HTTP |
