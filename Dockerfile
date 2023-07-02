FROM alpine

WORKDIR /kkbot

RUN apk update && apk upgrade
RUN apk add nodejs python3 py3-pip

RUN npm install pnpm -g

ENTRYPOINT ["pnpm","run", "docker"]