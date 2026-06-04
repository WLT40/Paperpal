"""
PaperPal Backend Launcher
Double-click to start. Choose storage directory on first run.
"""
import os, sys, json, webbrowser, subprocess, threading, time

CONFIG_FILE = "paperpal_config.json"
DATA_DIR = os.path.dirname(os.path.abspath(sys.argv[0]))

def get_config():
    cfg_path = os.path.join(DATA_DIR, CONFIG_FILE)
    if os.path.exists(cfg_path):
        with open(cfg_path) as f:
            return json.load(f)
    return None

def save_config(storage_dir):
    with open(os.path.join(DATA_DIR, CONFIG_FILE), "w") as f:
        json.dump({"storage_dir": storage_dir}, f)

def first_run():
    import tkinter as tk
    from tkinter import filedialog

    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)

    # Simple message
    tk.messagebox.showinfo(
        "PaperPal 首次设置",
        "欢迎使用 PaperPal！\n\n请选择一个文件夹用来储存文献数据。\n建议选择空间充足的磁盘（如 D 盘）。"
    )

    folder = filedialog.askdirectory(title="选择储存文件夹")
    if not folder:
        tk.messagebox.showerror("错误", "必须选择储存路径才能使用 PaperPal。")
        sys.exit(1)

    # Create subdirectories
    os.makedirs(os.path.join(folder, "data"), exist_ok=True)
    os.makedirs(os.path.join(folder, "pdf_storage"), exist_ok=True)

    save_config(folder)
    root.destroy()
    return folder

def main():
    config = get_config()
    if not config:
        storage = first_run()
    else:
        storage = config["storage_dir"]
        # Verify storage still exists
        if not os.path.exists(storage):
            print(f"储存路径 {storage} 不存在，重新设置...")
            storage = first_run()

    os.environ["PDF_STORAGE_DIR"] = os.path.join(storage, "pdf_storage")
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{os.path.join(storage, 'data', 'paperpal.db')}"
    os.environ["SYNC_DATABASE_URL"] = f"sqlite:///{os.path.join(storage, 'data', 'paperpal.db')}"

    # Start uvicorn
    import uvicorn
    print(f"PaperPal 后端启动中...")
    print(f"数据储存: {storage}")
    print(f"访问 http://localhost:5173 开始使用")
    print(f"关闭此窗口将停止服务")

    # Open browser after a short delay
    def open_browser():
        time.sleep(2)
        webbrowser.open("https://wlt40.github.io/Paperpal/")

    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_level="warning")

if __name__ == "__main__":
    main()
