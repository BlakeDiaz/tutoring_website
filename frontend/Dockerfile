FROM node:25.2-slim AS base

WORKDIR /site

COPY package*.json .
RUN npm install

COPY . .

FROM base AS development

ENV HOST=0.0.0.0

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS build

RUN npm run build

FROM caddy:2.10.2 AS production
COPY --from=build /site/dist /app/dist

VOLUME /app/dist
