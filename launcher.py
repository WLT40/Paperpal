"""PaperPal Backend Launcher v6 — simple and reliable"""
import os, sys, json, webbrowser, threading, time

CONFIG_FILE = "paperpal_config.json"

def get_data_dir():
    if getattr(sys, 'frozen', False): return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def get_config():
    cfg = os.path.join(get_data_dir(), CONFIG_FILE)
    if os.path.exists(cfg):
        with open(cfg) as f: return json.load(f)
    return None

def save_config(data):
    with open(os.path.join(get_data_dir(), CONFIG_FILE), "w") as f:
        json.dump(data, f, ensure_ascii=False)

def first_run():
    import tkinter as tk
    from tkinter import filedialog, messagebox

    root = tk.Tk()
    root.withdraw()

    messagebox.showinfo("PaperPal 首次设置", "请选择储存文献数据的文件夹。\n建议选 D 盘等空间充足的磁盘。")

    folder = filedialog.askdirectory(title="选择储存文件夹")
    if not folder:
        root.destroy()
        return None

    os.makedirs(os.path.join(folder, "data"), exist_ok=True)
    os.makedirs(os.path.join(folder, "pdf_storage"), exist_ok=True)

    cfg = {"storage_dir": folder}
    save_config(cfg)
    root.destroy()

    messagebox.showinfo("设置完成", f"数据将储存在：{folder}\n\n浏览器将自动打开 PaperPal。\n请在网页上注册账号后开始使用。")

    return cfg


def main():
    cfg = get_config()
    if not cfg or not os.path.exists(cfg.get("storage_dir", "")):
        cfg = first_run()
        if not cfg: return

    folder = cfg["storage_dir"]
    os.environ["PDF_STORAGE_DIR"] = os.path.join(folder, "pdf_storage")
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{os.path.join(folder, 'data', 'paperpal.db')}"
    os.environ["SYNC_DATABASE_URL"] = f"sqlite:///{os.path.join(folder, 'data', 'paperpal.db')}"

    if getattr(sys, 'frozen', False):
        sys.path.insert(0, sys._MEIPASS)

    import uvicorn
    print("=" * 50)
    print("  PaperPal 后端启动中...")
    print(f"  数据目录: {folder}")
    print(f"  打开浏览器访问: http://localhost:8000")
    print("  关闭此窗口将停止服务")
    print("=" * 50)

    def open_browser():
        time.sleep(2)
        webbrowser.open("http://localhost:8000")

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_level="warning")
    except Exception as e:
        import traceback
        err_file = os.path.join(get_data_dir(), "paperpal-error.log")
        with open(err_file, "w", encoding="utf-8") as f:
            f.write(traceback.format_exc())
        print(f"启动失败: {e}")
        print(f"错误日志: {err_file}")
        input("按回车退出...")


if __name__ == "__main__":
    main()
