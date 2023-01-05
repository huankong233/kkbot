import base64
from io import BytesIO
from PIL import Image
from logo import make_logo
import sys


def img_to_b64(pic: Image.Image) -> str:
    buf = BytesIO()
    pic.save(buf, format="PNG")
    base64_str = base64.b64encode(buf.getbuffer()).decode()
    return "base64://" + base64_str


if __name__ == "__main__":
    pic = img_to_b64(make_logo(sys.argv[1], sys.argv[2]))
    print(f"{pic}")
