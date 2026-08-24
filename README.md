# Remote Control App

A remote control application that allows you to control your computer from your mobile device. The project is split into a React Native frontend and a Node.js server for handling remote commands.

## Features
- **Mobile Client:** Built with React Native and Expo. Communicates with the backend server to send control commands.
- **Backend Server:** Node.js server utilizing Express and WebSockets. Uses `@nut-tree-fork/nut-js` to execute system-level commands (mouse, keyboard).
- **Real-time Communication:** Low-latency interactions using WebSockets and UDP.

## Project Structure

- `app/` - The Expo React Native mobile application.
- `server/` - The Node.js desktop server for executing system actions.

## Prerequisites

- Node.js (v20+ recommended)
- Expo CLI
- Python & Build tools (for `@nut-tree-fork/nut-js` native dependencies)

## Getting Started

### 1. Starting the Server

Navigate to the `server` directory, install dependencies, and start the server:

```bash
cd server
npm install
npm start
```
*Note: Make sure your desktop and mobile device are on the same local network.*

### 2. Starting the Mobile App

Navigate to the `app` directory, install dependencies, and launch the Expo development server:

```bash
cd app
npm install
npm start
```

Use the Expo Go app on your phone to scan the QR code and connect to the local server.

## License

ISC License
