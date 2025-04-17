class RfidServer {
    /**
     * Creates a new RfidServer instance.
     */
    constructor() {
        /**
         * WebSocket or SSE connection.
         * @private @type {WebSocket|EventSource}
         */
        this.connection_ = null;
        /**
         * The class of the connection (for looking up connection closed state).
         * @private @type {?function}
         */
        this.connectionType_ = null;
        /** @private @const {string} */
        this.url_ = new URL("http://nm-rfid-3.new-media-metagame.com:8001/");
        /** 
         * The event that is emmited when tap is detected
         * @type {CustomEvent} */
        this.tapEvent_ = new CustomEvent('strongTap', { detail: {} });
    }

    /**
     * Gets whether we are connected.
     * @return {boolean} Whether we are connected.
     */
    get connected() {
        return (this.connection_ &&
            this.connection_.readyState == this.connectionType_.OPEN);
    }

    /**
     * Disconnects from the server.
     */
    disconnect() {
        if (this.connection_) {
            console.log('Closing.', 'status');
            this.connection_.close();
            this.connection_ = null;
        }
    }

    /**
     * Connects to the server via WebSockets.
     */
    connectWebSocket() {
        this.disconnect();
        
        let protocol = (this.url_.protocol == 'https:') ? 'wss:' : 'ws:';
        let url = `${protocol}//${url.host}/ws`;
        console.log(`Connecting to ${url}...`, 'status');
        this.connection_ = new WebSocket(url);
        this.connectionType_ = WebSocket;
        this.addEventListeners_();
    }

    /**
     * Connects to the server via server-sent events.
     */
    connectSse() {
        this.disconnect();
        
        let url = `${this.url_.origin}/sse`;
        console.log(`Connecting to ${url}...`, 'status');
        this.connection_ = new EventSource(url);
        this.connectionType_ = EventSource;
        this.addEventListeners_();
    }

    /**
     * Adds event listeners to the connection.
     * @private
     */
    addEventListeners_() {
        this.connection_.addEventListener('open', (event) => {
            console.log(event);
            console.log('Connected.', 'status');
        });

        this.connection_.addEventListener('message', (event) => {
            console.log(event);
            console.log(`Tap: ${event.data}`);
            window.dispatchEvent(this.tapEvent_);
        });

        this.connection_.addEventListener('error', (event) => {
            console.error(event);
            console.log('Error, disconnected.', 'status error');
        });

        if (this.connectionType_ == WebSocket) {
            this.connection_.addEventListener('close', (event) => {
                console.log(event);
                console.log('Closed.', 'status');
            });
        }
    }

    /**
     * Handles a response to a POST message.
     * @param {!Response} response The fetch response.
     * @private
     */
    handleResponse_(response) {
        response.text().then((data) => {
            if (data) {
                try {
                    data = JSON.stringify(JSON.parse(data), null, 2);
                } catch (e) { }
                if (response.ok) {
                    console.log('Received response:', 'comment');
                    console.log(data, 'response');
                } else {
                    console.log(`Received error (${response.status}):`,
                        'comment error');
                    console.log(data, 'response error');
                }
            } else if (!response.ok) {
                console.log(`Received error (${response.status}): ` +
                    `${response.statusText}`,
                    'comment error');
            }
        });
    }

    /**
     * Sets the RFID reader lights.
     * @param {string} pattern The pattern name.
     * @param {number=} duration The length to show the pattern or 0 for
     *     persistent idle. In milliseconds.
     * @param {Object=} params Pattern-specific parameters.
     * * @private
     */
    setLights_(pattern, duration = 0, params = {}) {
        let data = Object.assign({ duration, pattern }, params);
        let body = new URLSearchParams(data);  // JSON.stringify(data);
        let url = `${this.url_.origin}/lights`;
        console.log(`Sending command to ${url}:`, 'comment');
        console.log(JSON.stringify(data, null, 2), 'command');
        fetch(url, {
            method: 'POST',
            body,
        }).then((response) => this.handleResponse_(response));
    }

    /**
     * Tests and RFID tap.
     * @param {string} rfidId The ID of the band to tap.
     */
    tap(rfidId) {
        let data = { rfidId };
        let body = new URLSearchParams(data);  // JSON.stringify(data);
        let url = `${this.url_.origin}/tap`;
        console.log(`Sending command to ${url}:`, 'comment');
        console.log(JSON.stringify(data, null, 2), 'command');
        fetch(url, {
            method: 'POST',
            body,
        }).then((response) => this.handleResponse_(response));
    }
}