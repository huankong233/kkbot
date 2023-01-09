from image_utils import BuildImage
import sys
from os.path import dirname

luxun_author = BuildImage(0,
                          0,
                          plain_text="--鲁迅",
                          font_size=30,
                          font=dirname(__file__) +
                          "/../../../resources/font/msyh.ttf",
                          font_color=(255, 255, 255))


def make_img(content):
    A = BuildImage(0, 0, font_size=37, background=dirname(__file__) + "/../../../resources/image/luxun.jpg",
                   font=dirname(__file__) + "/../../../resources/font/msyh.ttf")
    x = ""
    if len(content) > 40:
        raise ('too long')
    while A.getsize(content)[0] > A.w - 50:
        n = int(len(content) / 2)
        x += content[:n] + '\n'
        content = content[n:]
    x += content
    if len(x.split('\n')) > 2:
        raise ('too long')
    A.text(
        (int((480 - A.getsize(x.split("\n")[0])[0]) / 2), 300), x, (255, 255, 255))
    A.paste(luxun_author, (320, 400), True)

    return A.pic2bs4()


if __name__ == "__main__":
    print(f"{make_img(sys.argv[1])}")
