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
    tray.overrideredirect(True)  # no title bar
    tray.geometry("200x28+{}+{}".format(tray.winfo_screenwidth()-210, tray.winfo_screenheight()-60))
    tray.attributes('-topmost', True)
    tray.configure(bg='#4A90D9')

    def open_web():
        webbrowser.open("http://localhost:8000")

    def quit_app():
        tray.destroy()
        os._exit(0)

    menu = tk.Menu(tray, tearoff=0)
    menu.add_command(label="🌐 打开 PaperPal", command=open_web)
    menu.add_separator()
    menu.add_command(label="❌ 退出 PaperPal", command=quit_app)

    def show_menu(e):
        menu.post(e.x_root, e.y_root)

    f = tk.Frame(tray, bg='#4A90D9')
    f.pack(fill='both', expand=True)
    tk.Label(f, text="⚡ PaperPal", font=("Microsoft YaHei", 9, "bold"), fg="white", bg='#4A90D9').pack(side='left', padx=(8, 4))
    tk.Label(f, text="右键退出", font=("Microsoft YaHei", 7), fg="#cce0ff", bg='#4A90D9').pack(side='left')

    f.bind("<Button-3>", show_menu)
    f.bind("<Double-Button-1>", lambda e: open_web())
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

    # Fix stdout for --noconsole builds (uvicorn needs valid stdout)
    if getattr(sys, 'frozen', False) and sys.stdout is None:
        sys.stdout = open(os.devnull, 'w')
        sys.stderr = open(os.devnull, 'w')

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
