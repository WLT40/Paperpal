"""PaperPal Backend Launcher v7 — minimize to tray after start"""
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
    root = tk.Tk(); root.withdraw()
    messagebox.showinfo("PaperPal", "请选择储存文献数据的文件夹。\n建议选 D 盘等空间充足的磁盘。")
    folder = filedialog.askdirectory(title="选择储存文件夹")
    if not folder: root.destroy(); return None
    os.makedirs(os.path.join(folder, "data"), exist_ok=True)
    os.makedirs(os.path.join(folder, "pdf_storage"), exist_ok=True)
    cfg = {"storage_dir": folder}; save_config(cfg); root.destroy()
    messagebox.showinfo("设置完成", f"数据: {folder}\n\n浏览器将自动打开。\n右键任务栏 PaperPal 图标可退出。")
    return cfg

def create_tray():
    import tkinter as tk
    tray = tk.Tk()
    tray.title("PaperPal")
    tray.geometry("220x60+{}+{}".format(tray.winfo_screenwidth()-230, tray.winfo_screenheight()-100))
    tray.resizable(False, False)
    tray.attributes('-topmost', True)

    def open_web():
        webbrowser.open("http://localhost:8000")

    def quit_app():
        tray.destroy()
        os._exit(0)

    menubar = tk.Menu(tray, tearoff=0)
    menubar.add_command(label="🌐 打开 PaperPal", command=open_web)
    menubar.add_separator()
    menubar.add_command(label="❌ 退出", command=quit_app)

    def show_menu(e):
        menubar.post(e.x_root, e.y_root)

    tk.Label(tray, text="⚡ PaperPal 运行中", font=("Microsoft YaHei", 10, "bold")).pack(pady=(8, 0))
    tk.Label(tray, text="右键此处 → 退出\n双击 → 打开网页", font=("Microsoft YaHei", 8), fg="gray").pack(pady=(2, 5))

    tray.bind("<Button-3>", show_menu)
    tray.bind("<Double-Button-1>", lambda e: open_web())
    tray.protocol("WM_DELETE_WINDOW", quit_app)

    return tray

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

    def run_server():
        try:
            uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_level="warning")
        except Exception as e:
            import traceback
            err_file = os.path.join(get_data_dir(), "paperpal-error.log")
            with open(err_file, "w", encoding="utf-8") as f:
                f.write(traceback.format_exc())
            input(f"启动失败: {e}\n按回车退出...")

    threading.Thread(target=run_server, daemon=True).start()

    def open_browser():
        time.sleep(2)
        webbrowser.open("http://localhost:8000")

    threading.Thread(target=open_browser, daemon=True).start()

    tray = create_tray()
    tray.mainloop()

if __name__ == "__main__":
    main()
