// src/services/WebSocketService.tsx

interface MessageListener {
    (data: any): void;
}

interface WebSocketMessage {
    type: string;
    timestamp?: number;
    [key: string]: any;
}

class WebSocketService {
    private socket: WebSocket | null;
    private isConnected: boolean;
    private reconnectAttempts: number;
    private maxReconnectAttempts: number;
    private reconnectTimeout: NodeJS.Timeout | null;
    private messageListeners: MessageListener[];

    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        this.messageListeners = [];
    }

    // Connect to WebSocket server
    public connect(url: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                console.log(`Attempting to connect to WebSocket at: ${url}`);

                this.socket = new WebSocket(url);

                this.socket.onopen = (): void => {
                    console.log('WebSocket connection established');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    resolve(true);
                };

                this.socket.onmessage = (event: MessageEvent): void => {
                    console.log('Message received:', event.data);
                    try {
                        const data = JSON.parse(event.data);
                        // Notify all listeners of the new message
                        this.messageListeners.forEach(listener => listener(data));
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                this.socket.onerror = (error: Event): void => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };

                this.socket.onclose = (event: CloseEvent): void => {
                    console.log('WebSocket connection closed:', event.code, event.reason);
                    this.isConnected = false;

                    // Attempt to reconnect if not a clean close
                    if (event.code !== 1000) {
                        this._attemptReconnect(url);
                    }
                };
            } catch (error) {
                console.error('Failed to establish WebSocket connection:', error);
                reject(error);
            }
        });
    }

    // Close the WebSocket connection
    public disconnect(): void {
        if (this.socket && this.isConnected) {
            this.socket.close(1000, 'User initiated disconnect');
            this.isConnected = false;

            // Clear any pending reconnect attempts
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        }
    }

    // Send a message to the server
    public sendMessage(data: string | WebSocketMessage): boolean {
        if (this.socket && this.isConnected) {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            this.socket.send(message);
            return true;
        } else {
            console.error('Cannot send message: WebSocket is not connected');
            return false;
        }
    }

    // Add a listener for incoming messages
    public addMessageListener(callback: MessageListener): boolean {
        if (typeof callback === 'function') {
            this.messageListeners.push(callback);
            return true;
        }
        return false;
    }

    // Remove a message listener
    public removeMessageListener(callback: MessageListener): boolean {
        const index = this.messageListeners.indexOf(callback);
        if (index !== -1) {
            this.messageListeners.splice(index, 1);
            return true;
        }
        return false;
    }

    // Ping the server to check connection
    public ping(): boolean {
        return this.sendMessage({
            type: 'ping',
            timestamp: Date.now()
        });
    }

    // Check connection status
    public isConnectedToServer(): boolean {
        return this.isConnected;
    }

    // Private method to handle reconnection
    private _attemptReconnect(url: string): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * (2 ** this.reconnectAttempts), 30000);

            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

            this.reconnectTimeout = setTimeout(() => {
                this.connect(url).catch(error => {
                    console.error('Reconnection attempt failed:', error);
                });
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }
}

// Create and export a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
