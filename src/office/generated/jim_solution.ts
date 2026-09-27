html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MAHR Virtual Office - Student Workspace</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; margin: 20px; color: #333; }
        .workspace-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 20px;
        }
        .display-panel {
            border: 1px solid #ddd;
            padding: 15px;
            min-height: 200px;
            border-radius: 6px;
            background-color: #fcfcfc;
            overflow-y: auto;
        }
        #console-output {
            background-color: #282c34;
            color: #abb2bf;
            font-family: 'Fira Code', monospace;
            white-space: pre-wrap;
        }
        #whiteboard-content {
            background-color: #fff;
            border: 2px dashed #ccc;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-style: italic;
            color: #888;
        }
        .button-bar {
            text-align: center;
            margin-top: 20px;
        }
        button {
            padding: 10px 20px;
            font-size: 1em;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>

    <div class="workspace-container">
        <div id="console-output" class="display-panel">
            <p><strong>Console Output:</strong></p>
            <p>> Initializing MAHR system...</p>
            <p>> [INFO] WebSocket heartbeat monitored by Ryan. PONG!</p>
            <p>> [WARN] Input validation audit initiated by Dwight.</p>
            <p>> _(Lots of helpful output accumulates here...)_</p>
        </div>

        <div id="whiteboard-content" class="display-panel">
            <p><strong>Virtual Whiteboard:</strong></p>
            <p>Pam's architecture diagram sketches go here...</p>
            <p>Remember that PixiJS visual heartbeat? That's Jim's work!</p>
            <p>_(...and other brilliant ideas)_</p>
        </div>
    </div>

    <div class="button-bar">
        <button onclick="clearDisplayArea()">Clear Display</button>
    </div>

    <script>
        function clearDisplayArea() {
            // Get references to the elements we want to clear
            const consoleOutput = document.getElementById('console-output');
            const whiteboardContent = document.getElementById('whiteboard-content');
            
            // For the console, we just clear its entire inner HTML
            if (consoleOutput) {
                consoleOutput.innerHTML = '<p><strong>Console Output:</strong></p><p>> Display cleared by user command.</p>';
            }

            // For the whiteboard, we can set a default "clean slate" message
            if (whiteboardContent) {
                whiteboardContent.innerHTML = '<p><strong>Virtual Whiteboard:</strong></p><p>A fresh canvas for your next big idea!</p>';
            }

            // If we had a main interactive area that encompasses everything, we could target that too:
            // const mainInteractiveArea = document.getElementById('main-interactive-area');
            // if (mainInteractiveArea) {
            //     mainInteractiveArea.innerHTML = '<h1>Welcome back! Everything's clear!</h1>';
            // }

            console.log("Display area cleared!"); // Log to the browser's dev console
        }
    </script>

</body>
</html>