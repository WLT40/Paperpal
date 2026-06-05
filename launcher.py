"""
PaperPal Backend Launcher v3
"""
import os, sys, json, hashlib, secrets, webbrowser, time

CONFIG_FILE = "paperpal_config.json"

def get_data_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def get_config():
    cfg = os.path.join(get_data_dir(), CONFIG_FILE)
    if os.path.exists(cfg):
        with open(cfg) as f: return json.load(f)
    return None

def save_config(data):
    with open(os.path.join(get_data_dir(), CONFIG_FILE), "w") as f:
        json.dump(data, f)

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
    salt = secrets.token_hex(16)
    pw_hash = salt + "$" + hashlib.sha256((salt + password).encode()).hexdigest()

    cfg = {"storage_dir": folder, "email": email, "password": password}
    save_config(cfg)

    # Show credentials in a COPYABLE window
    cred_win = tk.Toplevel(root)
    cred_win.title("PaperPal 账号已生成 - 请保存")
    cred_win.geometry("480x320")
    cred_win.resizable(False, False)

    tk.Label(cred_win, text="你的 PaperPal 账号", font=("Microsoft YaHei", 14, "bold")).pack(pady=(20, 5))
    tk.Label(cred_win, text="请截图或复制保存，打开网页后使用", font=("Microsoft YaHei", 9), fg="gray").pack()

    frame = tk.Frame(cred_win, bg="white", relief="solid", bd=1)
    frame.pack(pady=10, padx=20, fill="x")

    info_text = f"邮箱：{email}\n密码：{password}\n\n储存路径：{folder}"
    text_widget = tk.Text(frame, height=6, font=("Consolas", 11), wrap="word", bd=0, padx=10, pady=10)
    text_widget.insert("1.0", info_text)
    text_widget.configure(state="disabled")  # read-only but selectable
    text_widget.pack(fill="x")

    def copy_all():
        root.clipboard_clear()
        root.clipboard_append(f"邮箱：{email}\n密码：{password}")
        copy_btn.config(text="已复制 ✓")
        copy_btn.after(2000, lambda: copy_btn.config(text="📋 复制账号密码"))

    btn_frame = tk.Frame(cred_win)
    btn_frame.pack(pady=15)

    copy_btn = tk.Button(btn_frame, text="📋 复制账号密码", command=copy_all,
                         font=("Microsoft YaHei", 10), bg="#4A90D9", fg="white",
                         padx=20, pady=5, bd=0, cursor="hand2")
    copy_btn.pack(side="left", padx=5)

    def open_web():
        webbrowser.open("http://localhost:5173")

    web_btn = tk.Button(btn_frame, text="🌐 打开 PaperPal 网站", command=open_web,
                        font=("Microsoft YaHei", 10), bg="#4CAF50", fg="white",
                        padx=20, pady=5, bd=0, cursor="hand2")
    web_btn.pack(side="left", padx=5)

    tk.Label(cred_win, text="⚠️ 关闭此窗口后，双击 exe 即可重新启动服务", font=("Microsoft YaHei", 8), fg="red").pack(side="bottom", pady=10)

    cred_win.protocol("WM_DELETE_WINDOW", lambda: [root.destroy()])
    root.deiconify()
    cred_win.lift()
    cred_win.focus_force()
    root.mainloop()

    return cfg

def main():
    cfg = get_config()
    if not cfg or not os.path.exists(cfg.get("storage_dir", "")) or not cfg.get("email"):
        cfg = first_run()
        if not cfg:
            return

    folder = cfg["storage_dir"]

    os.environ["PDF_STORAGE_DIR"] = os.path.join(folder, "pdf_storage")
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{os.path.join(folder, 'data', 'paperpal.db')}"
    os.environ["SYNC_DATABASE_URL"] = f"sqlite:///{os.path.join(folder, 'data', 'paperpal.db')}"

    if getattr(sys, 'frozen', False):
        sys.path.insert(0, sys._MEIPASS)

    # Open website
    webbrowser.open("http://localhost:5173")

    import uvicorn
    print(f"PaperPal 后端启动中... 数据: {folder}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_level="warning")

if __name__ == "__main__":
    main()
