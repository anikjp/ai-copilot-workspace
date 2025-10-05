// Debug endpoint to test what CopilotKit receives from HttpAgent
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>CopilotKit Debug</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
        button { padding: 10px 20px; margin: 10px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; }
        #output { margin-top: 20px; padding: 15px; background: #252526; border-radius: 4px; white-space: pre-wrap; }
        .success { color: #4ec9b0; }
        .error { color: #f48771; }
    </style>
</head>
<body>
    <h1>🔍 CopilotKit HttpAgent Debug</h1>
    
    <button onclick="testBackend()">Test Raw Backend Response</button>
    
    <div id="output"></div>

    <script>
        function log(msg, type = 'info') {
            const output = document.getElementById('output');
            const color = type === 'success' ? '#4ec9b0' : type === 'error' ? '#f48771' : '#9cdcfe';
            output.innerHTML += \`<div style="color: \${color}">\${msg}</div>\`;
        }

        async function testBackend() {
            document.getElementById('output').innerHTML = '';
            log('🧪 Testing backend response...');
            log('');
            
            const backendUrl = 'http://localhost:8000/stock-agent';
            
            try {
                log('📡 Calling: ' + backendUrl);
                
                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        messages: [{role: 'user', content: 'Hi'}],
                        state: {}
                    })
                });
                
                log('✅ Status: ' + response.status, 'success');
                log('');
                
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                const events = [];
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\\n\\n');
                    buffer = lines.pop() || '';
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const event = JSON.parse(line.substring(6));
                                events.push(event);
                            } catch (e) {}
                        }
                    }
                }
                
                log('✅ Total events: ' + events.length, 'success');
                log('');
                
                // Check each event type
                events.forEach(evt => {
                    log('📦 Event: ' + evt.type);
                    if (evt.type === 'TEXT_MESSAGE_CONTENT') {
                        log('  ✅ Has delta: ' + ('delta' in evt), 'success');
                        log('  ✅ Has messageId: ' + ('messageId' in evt), 'success');
                        log('  📝 Delta: ' + (evt.delta || '').substring(0, 100) + '...', 'success');
                    } else if (evt.type === 'RUN_STARTED') {
                        log('  threadId: ' + (evt.data?.threadId || evt.threadId || 'missing'), evt.data?.threadId || evt.threadId ? 'success' : 'error');
                        log('  runId: ' + (evt.data?.runId || evt.runId || 'missing'), evt.data?.runId || evt.runId ? 'success' : 'error');
                    }
                });
                
                log('');
                log('📋 Full Response:', 'info');
                log(JSON.stringify(events, null, 2));
                
            } catch (error) {
                log('❌ Error: ' + error, 'error');
            }
        }
    </script>
</body>
</html>
  `;
  
  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}

