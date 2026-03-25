package main

import (
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
)

func main() {
	exePath, err := os.Executable()
	if err != nil {
		return
	}
	dir := filepath.Dir(exePath)

	// Default backend name in the same folder
	backend := filepath.Join(dir, "discord-bridge.exe")

	// Allow overriding by passing the backend path as first arg
	if len(os.Args) > 1 {
		arg := os.Args[1]
		if filepath.IsAbs(arg) {
			backend = arg
		} else {
			backend = filepath.Join(dir, arg)
		}
	}

	cmd := exec.Command(backend)
	// Prefer the HideWindow flag (available on Windows). Also set CreationFlags
	// to CREATE_NO_WINDOW numeric value as a fallback to avoid undefined symbol
	// on some Go versions/platforms.
	const createNoWindow = 0x08000000
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow}

	if err := cmd.Start(); err != nil {
		// Log errors to a local file so launcher remains silent
		f, ferr := os.OpenFile(filepath.Join(dir, "launcher_errors.log"), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if ferr == nil {
			log.SetOutput(f)
			log.Println("failed to start backend:", err)
			f.Close()
		}
	}
	// Exit immediately; do not wait for backend
}
