FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY public ./public

# La aplicación solo ejecuta Node. npm no hace falta en la imagen final.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

ENV APP_NAME="DevOps Kubernetes Demo" \
    APP_VERSION=1.0.0 \
    APP_ENVIRONMENT=docker \
    PORT=3000 \
    NODE_ENV=production

EXPOSE 3000

USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/app.js"]
