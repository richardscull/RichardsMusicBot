FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN npm run build:deploy-commands

RUN npm install pm2 -g

CMD ["pm2-runtime", "start", "./build/index.js"]
