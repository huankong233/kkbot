FROM alpine
LABEL maintainer="2564076459@qq.com"
COPY requirements.txt /kkbot/requirements.txt
COPY start.sh /kkbot/start.sh
WORKDIR /kkbot
RUN apk update && apk upgrade
RUN apk add nodejs yarn python3 py3-pip
RUN pip3 install --no-cache-dir --upgrade pip
RUN pip3 install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
ENTRYPOINT ["bash","start.sh"]