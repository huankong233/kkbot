from EdgeGPT import Chatbot, ConversationStyle
import asyncio
import sys


async def main(user_prompt, context):
    bot = await Chatbot.create(cookie_path=sys.argv[1])
    answer = await bot.ask(prompt=user_prompt, webpage_context=context, conversation_style=ConversationStyle.creative, wss_link="wss://sydney.bing.com/sydney/ChatHub")
    print(str(answer))
    await bot.close()

# 初始化

with open(sys.argv[2], 'r', encoding='utf-8') as f:
    context = f.read()

asyncio.run(main(sys.argv[3], context))
