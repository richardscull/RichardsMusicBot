FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk add --no-cache ffmpeg python3 && ln -sf /usr/bin/python3 /usr/bin/python

RUN npm install

COPY . .

RUN npm run build:deploy-commands

RUN npm prune --omit=dev

RUN npm install pm2 -g

CMD ["pm2-runtime", "start", "./build/index.js"]
