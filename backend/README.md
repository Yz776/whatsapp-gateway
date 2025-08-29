# WhatsApp Gateway Backend

This is the backend server for the WhatsApp Gateway Dashboard, powered by Node.js, Express, Socket.IO, and `@whiskeysockets/baileys`.

## Features

-   Real-time communication with the frontend via Socket.IO.
-   WhatsApp connection management using Baileys.
-   Session persistence to stay logged in.
-   QR Code and Pairing Code generation for linking a device.
-   Sending and receiving messages.
-   Webhook integration for message events.
-   A simple REST API for programmatic access.
-   Dashboard statistics tracking.

## Setup Instructions

### 1. Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 2. Installation

1.  Navigate into the `backend` directory:
    ```bash
    cd backend
    ```

2.  Install the required dependencies:
    ```bash
    npm install
    ```

### 3. Configuration

1.  Create a `.env` file in the `backend` directory by copying the example file:
    ```bash
    cp .env.example .env
    ```

2.  Open the `.env` file and edit the variables:
    -   `PORT`: The port the server will run on (e.g., `3000`). The frontend will connect to this.
    -   `API_KEY`: A secure, random string that you will use to authenticate requests to the REST API.

### 4. Running the Server

-   **For development (with auto-reloading):**
    ```bash
    npm run dev
    ```
    This will start the server using `ts-node-dev`, which automatically restarts on file changes.

-   **For production:**
    First, you need to build the TypeScript code into JavaScript:
    ```bash
    npm run build
    ```
    Then, run the compiled code:
    ```bash
    npm start
    ```

## How It Works

-   **`auth_info` directory**: This directory will be created automatically to store your WhatsApp session files. **Do not share this folder**, as it contains the keys to access your WhatsApp account.
-   **Static Frontend**: The server is configured to serve the frontend files located in the parent directory (`../`). Make sure the backend directory is a sibling of your `index.html`.
-   **API**: The REST API endpoints are documented in the frontend's API Docs page. Remember to include the `X-API-KEY` header with the value from your `.env` file for all API requests.
