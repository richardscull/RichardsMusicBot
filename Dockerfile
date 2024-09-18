FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk update
RUN apk add
RUN apk add ffmpeg

RUN npm install --omit=dev

COPY . .

RUN npm run build:deploy-commands

RUN npm install pm2 -g

CMD ["pm2-runtime", "start", "./build/index.js"]
