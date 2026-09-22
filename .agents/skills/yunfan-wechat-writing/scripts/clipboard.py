#!/usr/bin/env python3
"""把 HTML 以富文本（text/html）形式写入剪贴板，供公众号编辑器粘贴。
用法: python3 clipboard.py /path/to/article.wechat.html
同时兼容 text/html 与纯文本降级。
"""
import sys

def main():
    if len(sys.argv) != 2:
        print("用法: python3 clipboard.py article.wechat.html", file=sys.stderr)
        sys.exit(1)
    html = open(sys.argv[1], encoding="utf-8").read()
    try:
        import AppKit
        pb = AppKit.NSPasteboard.generalPasteboard()
        pb.clearContents()
        data = AppKit.NSUserDefaults  # noqa: F841 (touch framework)
        nsdata = AppKit.NSData.dataWithBytes_length_(
            html.encode("utf-8"), len(html.encode("utf-8")))
        pb.setData_forType_(nsdata, AppKit.NSPasteboardTypeHTML)
        print("已复制到剪贴板（富文本），去公众号编辑器粘贴")
    except ImportError:
        import subprocess
        p = subprocess.Popen(["pbcopy"], stdin=subprocess.PIPE)
        p.communicate(html.encode("utf-8"))
        print("已复制纯文本到剪贴板（未安装 PyObjC，富文本失败）", file=sys.stderr)
        sys.exit(2)

if __name__ == "__main__":
    main()
