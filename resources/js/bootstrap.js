import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "axios";

// Axios setup
window.axios = axios;
window.axios.defaults.withCredentials = true;
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

// Pusher setup with FULL debug logging
window.Pusher = Pusher;
Pusher.logToConsole = true;

// Echo configuration for SSL
window.echo = new Echo({
    broadcaster: "pusher",
 key: "f4a7c2d9e8b1a3c6d5e7f0a9b2c4d6e1",
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || "mt1",
    wsHost: "192.168.2.221",
    wsPort: 86, // Apache SSL port
    wssPort: 86, // Same as above
    forceTLS: true,
    enabledTransports: ["ws", "wss"],
    authEndpoint: "https://192.168.2.221:86/MTS/broadcasting/auth",
    auth: {
        headers: {
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')
                ?.content,
            Accept: "application/json",
        },
        withCredentials: true,
    },
});

// Test connection
window.echo.connector.pusher.connection.bind("connected", () => {
    console.log("✅ Connected to Soketi WebSocket server!");
});

window.echo.connector.pusher.connection.bind("error", (err) => {
    console.error("❌ WebSocket connection error:", err);
});
