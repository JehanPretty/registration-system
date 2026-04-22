import socket
import psutil
import os

def get_local_ip():
    try:
        # Create a dummy socket to detect primary network interface
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def check_port_8000():
    print("\n" + "="*50)
    print(" REGISYS NETWORK DIAGNOSTIC TOOL")
    print("="*50)
    
    local_ip = get_local_ip()
    print(f"\n[1] YOUR MACHINE IP: {local_ip}")
    print(f"    (Your mobile Config.ts should use: http://{local_ip}:8000)")
    
    found_server = False
    for conn in psutil.net_connections():
        if conn.laddr.port == 8000 and conn.status == 'LISTEN':
            found_server = True
            addr = conn.laddr.ip
            print(f"\n[2] BACKEND STATUS: ACTIVE")
            print(f"    Listening on: {addr}")
            
            if addr == '127.0.0.1':
                print("\n    ❌ ISSUE DETECTED: SERVER IS LOCKED TO LOCALHOST!")
                print("    Your phone CANNOT connect to 127.0.0.1.")
                print("    FIX: Restart uvicorn with: --host 0.0.0.0")
            elif addr == '0.0.0.0':
                print("\n    ✅ GREAT! SERVER IS OPEN TO THE NETWORK.")
                print("    If login still fails, check your Windows Firewall.")
            break
            
    if not found_server:
        print("\n[2] BACKEND STATUS: OFFLINE")
        print("    No server found on port 8000.")
        print("    FIX: Start your backend first!")

    print("\n" + "="*50)

if __name__ == "__main__":
    try:
        import psutil
    except ImportError:
        print("Installing dependency (psutil) for diagnostics...")
        os.system("pip install psutil")
        import psutil
        
    check_port_8000()
