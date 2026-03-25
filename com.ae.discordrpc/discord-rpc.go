// // Created by Oliver. (c) 2026. All rights reserved.
// // https://github.com/harpoonwithaz/ae-discord-rpc

package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/hugolgst/rich-go/client"
)

var isConnected = false
var now = time.Now()
var lastSeen = time.Now()

var currentProject = "Unsaved Project"
var currentComp = "No Active Comp"

const clientID = "1469933901261701212"

type RequestPayload struct {
	Action string            `json:"action"`
	Data   map[string]string `json:"data"`
}

type ResponsePayload struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// Helper function to write errors to a file
func logError(contextMsg string, err error) {
	if err == nil {
		return
	}

	// Creates or appends to bridge_errors.log in the current working directory
	f, openErr := os.OpenFile("bridge_errors.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if openErr != nil {
		fmt.Printf("Failed to open log file: %v\n", openErr)
		return
	}
	defer f.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logEntry := fmt.Sprintf("[%s] %s: %v\n", timestamp, contextMsg, err)
	f.WriteString(logEntry)
	fmt.Printf("Logged error: %v\n", logEntry)
}

// checks if physical discord process in active
func isDiscordRunning() bool {
	cmd := exec.Command("tasklist")
	out, err := cmd.Output()
	if err != nil {
		logError("tasklist command failed", err)
		return false
	}
	output := string(out)
	return strings.Contains(output, "Discord.exe") ||
		strings.Contains(output, "DiscordPTB.exe") ||
		strings.Contains(output, "DiscordCanary.exe")
}

// Connect to discord client using rich-go
func connectDiscord() error {
	if isConnected {
		return nil
	}

	err := client.Login(clientID)
	if err != nil {
		fmt.Printf("Error connecting to discord: %v\n", err)
		logError("client.Login failed", err)
		isConnected = false
		return err
	}

	now = time.Now()
	isConnected = true
	fmt.Println("Successfully connected to discord")
	return nil
}

// logout of discord client
func disconnectDiscord() {
	isConnected = false

	go func() {
		defer func() { recover() }()
		client.Logout()
	}()

	fmt.Println("Disconnected from Discord")
}

// checks if the actual After Effects process is still running on Windows
func isAERunning() bool {
	cmd := exec.Command("tasklist")
	out, err := cmd.Output()
	if err != nil {
		// If tasklist fails, assume AE is alive to prevent accidental shutdowns
		return true
	}
	return strings.Contains(string(out), "AfterFX.exe")
}

// keeps tracks of pings from AE to see if the extension/AE is active
func heartbeatMonitor() {
	for {
		time.Sleep(5 * time.Second)

		// If the CEP panel goes to sleep and we miss pings for 15+ seconds
		if time.Since(lastSeen) > 20*time.Second {
			// Double-check if the actual AE application was closed
			if !isAERunning() {
				fmt.Println("After Effects process closed. Auto-closing bridge...")
				disconnectDiscord()
				os.Exit(0)
			}
		}
	}
}

func discordKeepAlive() {
	for {
		time.Sleep(5 * time.Second)
		if isConnected {
			if !isDiscordRunning() {
				fmt.Println("Discord process lost. Forcing disconnect.")
				disconnectDiscord()
				continue
			}

			err := client.SetActivity(client.Activity{
				State:      fmt.Sprintf("Comp: %v", strings.ReplaceAll(currentComp, "%20", " ")),
				Details:    fmt.Sprintf("Project: %v", strings.ReplaceAll(currentProject, "%20", " ")),
				LargeImage: "adobe_after_effects_cc_icon_svg",
				LargeText:  "Adobe After Effects",
				Timestamps: &client.Timestamps{Start: &now},
			})

			if err != nil {
				logError("Keep-alive SetActivity failed", err)
				disconnectDiscord()
			}
		}
	}
}

// updates status on discord
func updatePresence(project string, comp string) error {
	if !isConnected {
		err := connectDiscord()
		if err != nil {
			return err
		}
	}

	currentProject = project
	currentComp = comp

	err := client.SetActivity(client.Activity{
		State:      fmt.Sprintf("Comp: %v", strings.ReplaceAll(comp, "%20", " ")), // replaces adobes space character with whitespace
		Details:    fmt.Sprintf("Project: %v", strings.ReplaceAll(project, "%20", " ")),
		LargeImage: "adobe_after_effects_cc_icon_svg",
		LargeText:  "Adobe After Effects",
		Timestamps: &client.Timestamps{Start: &now},
	})

	if err != nil {
		fmt.Printf("Error setting activity: %v\n", err)
		logError("updatePresence SetActivity failed", err)
		disconnectDiscord() // disconnect when an error occurs
		return err
	}

	fmt.Println("Successfully set activity")
	return nil
}

// send json response to front end containing connection to discord status, and message
func sendResponse(conn net.Conn, status string, message string) {
	resp := ResponsePayload{Status: status, Message: message}
	respJSON, _ := json.Marshal(resp)
	conn.Write(append(respJSON, '\n'))
}

func main() {
	// connect to discord and start heartbeat
	connectDiscord()

	go heartbeatMonitor()
	go discordKeepAlive()

	// create a TCP connection with front end
	// using an arbitrary port.
	port := "54345"
	ln, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%v", port))
	if err != nil {
		fmt.Printf("Error starting server: %v\n", err)
		logError("net.Listen failed", err)
	}
	fmt.Printf("Listening on localhost:%v...\n", port)

	for {
		conn, err := ln.Accept()
		if err != nil {
			logError("ln.Accept failed", err)
			fmt.Printf("Error accepting connection: %v", err)
			continue
		}

		// keeps track of last ping from AE to monitor heartbeat
		lastSeen = time.Now()

		message, err := bufio.NewReader(conn).ReadString('\n')
		if err != nil {
			logError("TCP ReadString failed", err)
			fmt.Printf("Error TCP ReadString failed: %v", err)
			conn.Close()
			continue
		}
		fmt.Printf("Received message: %v", message)

		// parses json response from frontend
		var req RequestPayload
		err = json.Unmarshal([]byte(strings.TrimSpace(message)), &req)
		if err != nil {
			logError("JSON Unmarshal failed", err)
			fmt.Printf("Error JSON Unmarshal failed: %v", err)
			sendResponse(conn, "ERROR", "Invalid JSON format")
			conn.Close()
			continue
		}

		// Front end sends a connect, disconnect, or status request
		switch req.Action {
		case "STATUS":
			// Checks if the discord process was killed, updating the connection status
			if isConnected && !isDiscordRunning() {
				disconnectDiscord()
			}

			if !isDiscordRunning() {
				sendResponse(conn, "ERROR", "Discord not detected")
				fmt.Println("Sending response: ERROR, Discord not detected")
			} else if isConnected {
				proj := req.Data["project"]
				comp := req.Data["comp"]

				// project info has changed since last presence update
				if proj != currentProject || comp != currentComp {
					updatePresence(proj, comp)
					sendResponse(conn, "CONNECTED", "Discord is active, presence updated")
					fmt.Println("Sending response: CONNECTED, Discord is active, presence updated")
				} else {
					sendResponse(conn, "CONNECTED", "Discord is active")
					fmt.Println("Sending response: CONNECTED, Discord is active")
				}
			} else {
				sendResponse(conn, "DISCONNECTED", "Discord is offline")
				fmt.Println("Sending response: DISCONNECTED, Discord is offline")
			}
		case "DISCONNECT":
			disconnectDiscord()
			sendResponse(conn, "SUCCESS", "Disconnected")
			fmt.Println("Sending response: SUCCESS, Disconnected")
		case "UPDATE_PRESENCE":
			// keeps track of project info
			proj := req.Data["project"]
			comp := req.Data["comp"]
			err = updatePresence(proj, comp)
			if err != nil {
				logError("UPDATE_PRESENCE action failed", err)
				fmt.Printf("Sending response: ERROR, %v\n", err.Error())
				sendResponse(conn, "ERROR", err.Error())
			} else {
				sendResponse(conn, "SUCCESS", "Presence updated")
				fmt.Println("Sending response: SUCCESS, Presence updated")
			}
		case "SHUTDOWN":
			disconnectDiscord()
			sendResponse(conn, "SUCCESS", "Shutting down bridge")
			go func() {
				time.Sleep(100 * time.Millisecond)
				os.Exit(0)
			}()
		default:
			sendResponse(conn, "ERROR", "Unknown action")
		}

		conn.Close()
	}
}
