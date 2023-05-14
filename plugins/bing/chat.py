from EdgeGPT import Chatbot, ConversationStyle
import asyncio
import sys
import random
import json


def generate_random_str(randomlength=16):
    """
    生成一个指定长度的随机字符串
    """
    random_str = ''
    base_str = 'ABCDEFGHIGKLMNOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz0123456789'
    length = len(base_str) - 1
    for i in range(randomlength):
        random_str += base_str[random.randint(0, length)]
    return random_str


async def main(user_prompt, context):
    bot = await Chatbot.create(cookie_path=sys.argv[1])
    answer = await bot.ask(prompt=user_prompt, webpage_context=context, conversation_style=ConversationStyle.creative, wss_link="wss://sydney.bing.com/sydney/ChatHub")
    await bot.close()
    return answer

# 初始化
context = open(sys.argv[2], 'r', encoding='utf-8').read()

outputname = generate_random_str()
response = asyncio.run(main(sys.argv[3], context))


# 输出结果
with open(f"./temp/{outputname}.info", 'w', encoding='utf-8') as f:
    f.write(json.dumps(response, ensure_ascii=False))

print(outputname)
