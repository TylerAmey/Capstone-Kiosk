class RfidServer {
    /**
     * @param {!HTMLElement} messageBox The div to display messages.
     */
    constructor(messageBox) {
        /** @private @const {!HTMLElement} **/
        this.messageBox_ = messageBox;

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
            this.addMessage_('Closing.', 'status');
            this.connection_.close();
            this.connection_ = null;
        }
    }

    /**
     * Connects to the server via WebSockets.
     */
    connectWebSocket() {
        this.disconnect();
        this.clearMessages();
        let url = new URL(window.location);
        let protocol = (url.protocol == 'https:') ? 'wss:' : 'ws:';
        url = `${protocol}//${url.host}/ws`;
        this.addMessage_(`Connecting to ${url}...`, 'status');
        this.connection_ = new WebSocket(url);
        this.connectionType_ = WebSocket;
        this.addEventListeners_();
    }

    /**
     * Connects to the server via server-sent events.
     */
    connectSse() {
        this.disconnect();
        this.clearMessages();
        let url = new URL(window.location);
        url = `${url.origin}/sse`;
        this.addMessage_(`Connecting to ${url}...`, 'status');
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
            this.addMessage_('Connected.', 'status');
        });

        this.connection_.addEventListener('message', (event) => {
            console.log(event);
            this.addMessage_(`Tap: ${event.data}`);
        });

        this.connection_.addEventListener('error', (event) => {
            console.error(event);
            this.addMessage_('Error, disconnected.', 'status error');
        });

        if (this.connectionType_ == WebSocket) {
            this.connection_.addEventListener('close', (event) => {
                console.log(event);
                this.addMessage_('Closed.', 'status');
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
                    this.addMessage_('Received response:', 'comment');
                    this.addMessage_(data, 'response');
                } else {
                    this.addMessage_(`Received error (${response.status}):`,
                        'comment error');
                    this.addMessage_(data, 'response error');
                }
            } else if (!response.ok) {
                this.addMessage_(`Received error (${response.status}): ` +
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
     */
    setLights(pattern, duration = 0, params = {}) {
        let data = Object.assign({ duration, pattern }, params);
        let body = new URLSearchParams(data);  // JSON.stringify(data);
        let url = new URL(window.location);
        url = `${url.origin}/lights`;
        this.addMessage_(`Sending command to ${url}:`, 'comment');
        this.addMessage_(JSON.stringify(data, null, 2), 'command');
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
        let url = new URL(window.location);
        url = `${url.origin}/tap`;
        this.addMessage_(`Sending command to ${url}:`, 'comment');
        this.addMessage_(JSON.stringify(data, null, 2), 'command');
        fetch(url, {
            method: 'POST',
            body,
        }).then((response) => this.handleResponse_(response));
    }

    /**
     * Adds a message to the message box.
     * @param {string} message The text of the message.
     * @param {string=} className Name of a class to attach to the message.
     * @private
     */
    addMessage_(message, className = '') {
        let elem = document.createElement('div');
        elem.className = className;
        elem.textContent = message;
        this.messageBox_.appendChild(elem);
        this.messageBox_.scrollTop = this.messageBox_.scrollHeight;
    }
}