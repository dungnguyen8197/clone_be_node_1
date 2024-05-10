FROM node:14.17-alpine as builder
RUN apk add git
WORKDIR /app
COPY package.json .
RUN npm install
FROM node:14.17-alpine
WORKDIR /app
COPY --from=builder /app .
COPY . .
CMD [ "node", "server.js" ]
