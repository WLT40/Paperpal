"""PaperPal Backend Launcher v8 — proper system tray icon"""
import os, sys, json, webbrowser, threading, time

CONFIG_FILE = "paperpal_config.json"

def get_data_dir():
    if getattr(sys, 'frozen', False): return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def get_config():
    cfg = os.path.join(get_data_dir(), CONFIG_FILE)
    if os.path.exists(cfg): return json.load(open(cfg))
    return None

def save_config(data):
    json.dump(data, open(os.path.join(get_data_dir(), CONFIG_FILE), "w"), ensure_ascii=False)

def first_run():
    import tkinter as tk
    from tkinter import filedialog, messagebox
    root = tk.Tk(); root.withdraw()
    messagebox.showinfo("PaperPal", "请选择储存文献数据的文件夹。\n建议选 D 盘等空间充足的磁盘。")
    folder = filedialog.askdirectory(title="选择储存文件夹")
    if not folder: root.destroy(); return None
    os.makedirs(os.path.join(folder, "data"), exist_ok=True)
    os.makedirs(os.path.join(folder, "pdf_storage"), exist_ok=True)
    save_config({"storage_dir": folder})
    root.destroy()
    return folder

def main():
    cfg = get_config()
    if not cfg or not os.path.exists(cfg.get("storage_dir", "")):
        folder = first_run()
        if not folder: return
        cfg = {"storage_dir": folder}

    folder = cfg["storage_dir"]
    os.environ["PDF_STORAGE_DIR"] = os.path.join(folder, "pdf_storage")
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{os.path.join(folder, 'data', 'paperpal.db')}"
    os.environ["SYNC_DATABASE_URL"] = f"sqlite:///{os.path.join(folder, 'data', 'paperpal.db')}"

    if getattr(sys, 'frozen', False):
        sys.path.insert(0, sys._MEIPASS)
        if sys.stdout is None:
            sys.stdout = open(os.devnull, 'w')
            sys.stderr = open(os.devnull, 'w')

    import uvicorn

    def run_server():
        try:
            uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_level="warning")
        except Exception as e:
            import traceback
            with open(os.path.join(get_data_dir(), "paperpal-error.log"), "w", encoding="utf-8") as f:
                f.write(traceback.format_exc())

    threading.Thread(target=run_server, daemon=True).start()
    time.sleep(1.5)

    # System tray icon
    from PIL import Image, ImageDraw
    import pystray

    # Create a simple icon (purple lightning bolt on transparent bg)
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([8, 4, 56, 60], radius=12, fill='#7C3AED')
    draw.polygon([(28, 14), (44, 32), (32, 32), (38, 52), (20, 34), (32, 34)], fill='white')

    def open_web(icon, item):
        webbrowser.open("http://localhost:8000")

    def quit_app(icon, item):
        icon.stop()
        os._exit(0)

    menu = pystray.Menu(
        pystray.MenuItem("🌐 打开 PaperPal", open_web, default=True),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("❌ 退出", quit_app),
    )

    icon = pystray.Icon("PaperPal", img, "PaperPal", menu)

    # Open browser
    threading.Thread(target=lambda: (time.sleep(0.5), webbrowser.open("http://localhost:8000")), daemon=True).start()

    icon.run()

if __name__ == "__main__":
    main()
