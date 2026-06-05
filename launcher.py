"""PaperPal Backend Launcher v5 — tkinter in main thread, wait then start server"""
import os, sys, json, hashlib, secrets, webbrowser, threading, time

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
    from tkinter import filedialog

    root = tk.Tk()
    root.withdraw()

    folder = filedialog.askdirectory(title="选择储存文献数据的文件夹（建议选 D 盘）")
    if not folder:
        root.destroy()
        sys.exit(0)

    os.makedirs(os.path.join(folder, "data"), exist_ok=True)
    os.makedirs(os.path.join(folder, "pdf_storage"), exist_ok=True)

    email = f"user{secrets.randbelow(999999):06d}@paperpal.local"
    password = secrets.token_hex(4)

    cfg = {"storage_dir": folder, "email": email, "password": password}
    save_config(cfg)

    # Show credentials window
    w = tk.Toplevel(root)
    w.title("PaperPal 账号已生成")
    w.geometry("500x370")
    w.resizable(False, False)

    tk.Label(w, text="你的 PaperPal 账号", font=("Microsoft YaHei", 14, "bold")).pack(pady=(20, 8))
    tk.Label(w, text="请截图保存，然后打开浏览器访问 http://localhost:8000", font=("Microsoft YaHei", 9), fg="gray").pack()

    f = tk.Frame(w, bg="white", relief="solid", bd=1)
    f.pack(pady=10, padx=20, fill="x")
    info = f"邮箱：{email}\n密码：{password}\n\n打开浏览器访问：http://localhost:8000\n\n储存路径：{folder}"
    tw = tk.Text(f, height=7, font=("Consolas", 11), wrap="word", bd=0, padx=10, pady=10)
    tw.insert("1.0", info)
    tw.configure(state="disabled")
    tw.pack(fill="x")

    def copy_all():
        root.clipboard_clear()
        root.clipboard_append(f"邮箱：{email}\n密码：{password}")
        cb.config(text="已复制 ✓")
        cb.after(2000, lambda: cb.config(text="📋 复制账号密码"))

    def open_web():
        webbrowser.open("http://localhost:8000")

    bf = tk.Frame(w)
    bf.pack(pady=15)
    cb = tk.Button(bf, text="📋 复制账号密码", command=copy_all, font=("Microsoft YaHei", 10), bg="#4A90D9", fg="white", padx=20, pady=5, bd=0, cursor="hand2")
    cb.pack(side="left", padx=5)
    tk.Button(bf, text="🌐 打开 PaperPal (localhost:8000)", command=open_web, font=("Microsoft YaHei", 10), bg="#4CAF50", fg="white", padx=20, pady=5, bd=0, cursor="hand2").pack(side="left", padx=5)

    tk.Label(w, text="⚠️ 请复制账号密码后关闭此窗口", font=("Microsoft YaHei", 9), fg="red").pack(pady=(5, 0))
    tk.Label(w, text="关闭后自动启动服务，保持黑窗口打开，浏览器访问 localhost:8000", font=("Microsoft YaHei", 8), fg="gray").pack(pady=(0, 10))

    w.protocol("WM_DELETE_WINDOW", lambda: root.destroy())
    root.deiconify()
    root.mainloop()
    return cfg


def main():
    cfg = get_config()
    if not cfg or not os.path.exists(cfg.get("storage_dir", "")) or not cfg.get("email"):
        cfg = first_run()
        if not cfg: return

    folder = cfg["storage_dir"]
    os.environ["PDF_STORAGE_DIR"] = os.path.join(folder, "pdf_storage")
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{os.path.join(folder, 'data', 'paperpal.db')}"
    os.environ["SYNC_DATABASE_URL"] = f"sqlite:///{os.path.join(folder, 'data', 'paperpal.db')}"

    if getattr(sys, 'frozen', False):
        sys.path.insert(0, sys._MEIPASS)

    import uvicorn
    print(f"PaperPal 后端启动中... 数据: {folder}")

    def open_browser():
        time.sleep(2)
        webbrowser.open("http://localhost:8000")

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_level="info")
    except Exception as e:
        import traceback
        err_file = os.path.join(get_data_dir(), "paperpal-error.log")
        with open(err_file, "w", encoding="utf-8") as f:
            f.write(traceback.format_exc())
        print(f"启动失败: {e}\n错误日志: {err_file}")
        input("按回车退出...")


if __name__ == "__main__":
    main()
