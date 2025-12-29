FROM node:25.2-slim

WORKDIR /site

COPY package*.json .
RUN npm install

COPY . .

ENV HOST=0.0.0.0

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
