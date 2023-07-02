FROM alpine

WORKDIR /kkbot

RUN apk update && apk upgrade
RUN apk add nodejs npm python3 py3-pip npm

RUN npm install pnpm -g

ENTRYPOINT ["pnpm","run", "docker"]