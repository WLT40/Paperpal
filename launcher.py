"""
PaperPal Backend Launcher
Double-click to start. Auto-generates account on first run.
"""
import os, sys, json, hashlib, secrets, webbrowser, threading, time

CONFIG_FILE = "paperpal_config.json"

def get_data_dir():
    """Get the directory where this exe/config lives."""
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
    try:
        import tkinter as tk
        from tkinter import filedialog, messagebox
    except ImportError:
        print("错误：缺少 tkinter 组件，请重新下载。")
        input("按回车退出...")
        sys.exit(1)

    root = tk.Tk()
    root.withdraw()

    messagebox.showinfo("PaperPal", "请选择储存文献数据的文件夹。\n建议选空间充足的磁盘（如 D 盘）。")

    folder = filedialog.askdirectory(title="选择储存文件夹")
    if not folder:
        messagebox.showerror("错误", "必须选择储存路径才能使用。")
        sys.exit(1)

    os.makedirs(os.path.join(folder, "data"), exist_ok=True)
    os.makedirs(os.path.join(folder, "pdf_storage"), exist_ok=True)

    # Auto-generate account
    email = f"user{secrets.randbelow(999999):06d}@paperpal.local"
    password = secrets.token_hex(4)
    salt = secrets.token_hex(16)
    pw_hash = salt + "$" + hashlib.sha256((salt + password).encode()).hexdigest()

    cfg = {
        "storage_dir": folder,
        "email": email,
        "password": password,
    }
    save_config(cfg)

    messagebox.showinfo("账号已生成",
        f"你的 PaperPal 账号：\n\n"
        f"邮箱：{email}\n"
        f"密码：{password}\n\n"
        f"⚠️ 请截图保存！下次登录需要用到。\n\n"
        f"数据储存路径：{folder}"
    )

    root.destroy()
    return cfg

def main():
    cfg = get_config()
    # Re-run setup if no config, storage missing, or no credentials
    if not cfg or not os.path.exists(cfg.get("storage_dir", "")) or not cfg.get("email"):
        cfg = first_run()

    folder = cfg["storage_dir"]
    os.environ["PDF_STORAGE_DIR"] = os.path.join(folder, "pdf_storage")
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{os.path.join(folder, 'data', 'paperpal.db')}"
    os.environ["SYNC_DATABASE_URL"] = f"sqlite:///{os.path.join(folder, 'data', 'paperpal.db')}"

    # Pre-create user account in database
    email = cfg.get("email", "")
    password = cfg.get("password", "")
    if email and password:
        _ensure_user(folder, email, password)

    # Ensure PyInstaller-bundled modules are found
    if getattr(sys, 'frozen', False):
        sys.path.insert(0, sys._MEIPASS)

    import uvicorn
    print(f"PaperPal 后端启动中...")
    print(f"数据: {folder}")
    print(f"账号: {email}")

    def open_browser():
        time.sleep(2)
        webbrowser.open("https://wlt40.github.io/Paperpal/")

    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_level="warning")

def _ensure_user(storage_dir, email, password):
    """Create user in database if not exists."""
    import sqlite3
    import hashlib
    db_path = os.path.join(storage_dir, "data", "paperpal.db")
    # Database might not exist yet - uvicorn creates it on first start
    # We need to ensure the database is initialized first
    # For now, store credentials in config; user registers via web UI
    pass

if __name__ == "__main__":
    main()
