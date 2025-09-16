const vscode = acquireVsCodeApi();

let headersEditor;
let bodyEditor;
let extraFieldsEditor;
let envVarsEditor;
let environments = {};
let activeEnvironment = 'default';

// --- Monaco Editor Initialization ---
function initMonacoEditors() {
    // Configure Monaco to use the correct base path
    require.config({ 
        paths: { 
            'vs': window.MONACO_BASE
        }
    });

    require(['vs/editor/editor.main'], function() {
        headersEditor = monaco.editor.create(document.getElementById('headersEditor'), {
            value: '{\n    \n}',
            language: 'json',
            theme: 'vs-dark',
            minimap: { enabled: false },
            automaticLayout: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            formatOnType: true
        });

        bodyEditor = monaco.editor.create(document.getElementById('bodyEditor'), {
            value: '',
            language: 'json',
            theme: 'vs-dark',
            minimap: { enabled: false },
            automaticLayout: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            formatOnType: true
        });

        extraFieldsEditor = monaco.editor.create(document.getElementById('extraFieldsEditor'), {
            value: '{\n    \n}',
            language: 'json',
            theme: 'vs-dark',
            minimap: { enabled: false },
            automaticLayout: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            formatOnType: true
        });

        envVarsEditor = monaco.editor.create(document.getElementById('envVarsEditor'), {
            value: '{\n    \n}',
            language: 'json',
            theme: 'vs-dark',
            minimap: { enabled: false },
            automaticLayout: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            formatOnType: true
        });

        // Add resize observer to handle layout changes
        const resizeObserver = new ResizeObserver(() => {
            setTimeout(() => {
                if (headersEditor) headersEditor.layout();
                if (bodyEditor) bodyEditor.layout();
                if (extraFieldsEditor) extraFieldsEditor.layout();
                if (envVarsEditor) envVarsEditor.layout();
            }, 100);
        });

        // Observe all editor containers
        document.querySelectorAll('.monaco-editor-container').forEach(container => {
            resizeObserver.observe(container);
        });

        // Now that editors are created, hide all tabs except the default one
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById('authContent').classList.remove('hidden');
    });
}

// --- Scoped Tab Switching Logic ---
function setupTabs() {
    document.querySelectorAll('.tabs:not(.response-tabs-content) > .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tabs:not(.response-tabs-content) > .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

            const tabName = tab.dataset.tab;
            const contentEl = document.getElementById(tabName + 'Content');
            if (contentEl) contentEl.classList.remove('hidden');
            tab.classList.add('active');

            // Force layout update after tab switch
            setTimeout(() => {
                if (headersEditor) headersEditor.layout();
                if (bodyEditor) bodyEditor.layout();
                if (extraFieldsEditor) extraFieldsEditor.layout();
                if (envVarsEditor) envVarsEditor.layout();
            }, 100);
        });
    });

    document.querySelectorAll('.response-tabs-content > .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.response-tabs-content > .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('#responseBodyContent, #responseHeadersContent, #responseDetailsContent').forEach(c => c.classList.add('hidden'));

            const tabName = tab.dataset.tab;
            const contentEl = document.getElementById(tabName + 'Content');
            if (contentEl) contentEl.classList.remove('hidden');
            tab.classList.add('active');
        });
    });
}

// --- Body Type Switching ---
document.getElementById('bodyType').addEventListener('change', () => {
    const type = document.getElementById('bodyType').value;
    const jsonRawSection = document.getElementById('bodyJsonRaw');
    const filesSection = document.getElementById('bodyFiles');

    jsonRawSection.classList.add('hidden');
    filesSection.classList.add('hidden');

    if (type === "json" || type === "raw" || type === "urlencoded") {
        jsonRawSection.classList.remove('hidden');
        if (bodyEditor) {
            const language = type === "json" ? "json" : "plaintext";
            monaco.editor.setModelLanguage(bodyEditor.getModel(), language);
        }
    } else if (type === "formdata") {
        filesSection.classList.remove('hidden');
    }

    // Force layout update
    setTimeout(() => {
        if (bodyEditor) bodyEditor.layout();
    }, 100);
});

// --- History & Environment Logic ---
function loadEnvironments(envs, activeEnv) {
    environments = envs;
    activeEnvironment = activeEnv;
    const envSelect = document.getElementById('envSelect');
    envSelect.innerHTML = '';
    Object.keys(environments).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        envSelect.appendChild(option);
    });
    envSelect.value = activeEnvironment;
    if (envVarsEditor && environments[activeEnvironment]) {
        envVarsEditor.setValue(JSON.stringify(environments[activeEnvironment], null, 2));
    }
}

function saveEnvironments() {
    if (!envVarsEditor) return;
    const envVars = envVarsEditor.getValue();
    try {
        const parsedVars = JSON.parse(envVars);
        environments[activeEnvironment] = parsedVars;
        vscode.postMessage({ command: 'saveEnvironments', environments, activeEnvironment });
    } catch (e) {
        alert('Invalid JSON in environment variables.');
    }
}

document.getElementById('addEnvBtn').addEventListener('click', () => {
    const name = prompt('Enter new environment name:');
    if (name && !environments[name]) {
        environments[name] = {};
        activeEnvironment = name;
        loadEnvironments(environments, activeEnvironment);
        saveEnvironments();
    } else if (name) {
        alert('Environment with that name already exists.');
    }
});

document.getElementById('envSelect').addEventListener('change', (e) => {
    activeEnvironment = e.target.value;
    if (envVarsEditor && environments[activeEnvironment]) {
        envVarsEditor.setValue(JSON.stringify(environments[activeEnvironment], null, 2));
    }
});

// --- Request Sending ---
function processVariables(data) {
    if (typeof data !== 'string' || !environments[activeEnvironment]) return data;
    let processedData = data;
    const variables = environments[activeEnvironment];
    for (const key in variables) {
        const placeholder = `{{${key}}}`;
        processedData = processedData.replace(new RegExp(placeholder, 'g'), variables[key]);
    }
    return processedData;
}

document.getElementById('sendBtn').addEventListener('click', () => {
    const method = document.getElementById('method').value;
    const url = processVariables(document.getElementById('url').value);
    const authType = document.getElementById('authType').value;
    const authValue = document.getElementById('authValue').value;
    const headersText = headersEditor ? headersEditor.getValue() : '{}';
    const bodyType = document.getElementById('bodyType').value;
    const bodyText = bodyEditor ? bodyEditor.getValue() : '';
    const extraFieldsText = extraFieldsEditor ? extraFieldsEditor.getValue() : '{}';

    let headers = {};
    try { headers = JSON.parse(processVariables(headersText)); } catch(e) { alert("Invalid headers JSON"); return; }

    if (authType === "bearer") headers["Authorization"] = "Bearer " + processVariables(authValue);
    else if (authType === "basic") headers["Authorization"] = "Basic " + btoa(processVariables(authValue));
    else if (authType === "apikey") headers["X-API-Key"] = processVariables(authValue);

    if (bodyType === "formdata") {
        const files = document.getElementById('fileInput').files;
        let serialized = { files: [], fields: {} };
        const promises = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            promises.push(new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    serialized.files.push({
                        name: file.name,
                        field: "file" + (i + 1),
                        content: reader.result.split(",")[1]
                    });
                    resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            }));
        }
        try {
            if (extraFieldsText) serialized.fields = JSON.parse(processVariables(extraFieldsText));
        } catch (e) { alert("Invalid JSON in extra fields"); return; }

        Promise.all(promises).then(() => {
            vscode.postMessage({ command: 'sendRequest', method, url, headers, bodyType, body: serialized });
        }).catch(err => { alert("Error reading files: " + err.message); });
        return;
    }

    let body = null;
    if (bodyType !== "none") {
        body = processVariables(bodyText);
        if (bodyType === "json") headers["Content-Type"] = "application/json";
        else if (bodyType === "urlencoded") headers["Content-Type"] = "application/x-www-form-urlencoded";
        else if (bodyType === "raw") headers["Content-Type"] = "text/plain";
    }
    vscode.postMessage({ command: 'sendRequest', method, url, headers, bodyType, body });
});

// --- Response ---
function updateResponsePanel(msg) {
    const bodyEl = document.getElementById('responseBody');
    const headersEl = document.getElementById('responseHeaders');
    const detailsEl = document.getElementById('responseDetails');

    let formattedBody = msg.body;
    const contentType = msg.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
        try { formattedBody = JSON.stringify(JSON.parse(msg.body), null, 2); }
        catch (e) { formattedBody = "Invalid JSON\n\n" + msg.body; }
    } else if (contentType.includes('text/html')) {
        formattedBody = "HTML response\n\n" + msg.body;
    }
    bodyEl.textContent = formattedBody;
    headersEl.textContent = Object.entries(msg.headers).map(([k,v]) => `${k}: ${v}`).join('\n');
    detailsEl.innerHTML = `<span class="status-${Math.floor(msg.status/100)}xx">Status: ${msg.status} ${msg.statusText}</span><br>Duration: ${msg.duration}ms<br>Size: ${msg.size} bytes`;
}

// --- History ---
function loadHistory(history) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    history.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.method}</strong> ${item.url}<div class="history-item-details">${new Date(item.timestamp).toLocaleString()}</div>`;
        li.addEventListener('click', () => loadRequestFromHistory(item));
        historyList.appendChild(li);
    });
}

function loadRequestFromHistory(request) {
    document.getElementById('method').value = request.method;
    document.getElementById('url').value = request.url;
    document.getElementById('authType').value = request.authType;
    document.getElementById('authValue').value = request.authValue;

    if (headersEditor) headersEditor.setValue(JSON.stringify(request.headers, null, 2));
    const bodyTypeSelect = document.getElementById('bodyType');
    bodyTypeSelect.value = request.bodyType;
    bodyTypeSelect.dispatchEvent(new Event('change'));

    if (request.bodyType === 'formdata') {
        if (extraFieldsEditor) extraFieldsEditor.setValue(JSON.stringify(request.body.fields, null, 2));
    } else if (bodyEditor) {
        bodyEditor.setValue(request.body);
    }
    document.querySelector('.tab[data-tab="body"]').click();
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Monaco editors first
    initMonacoEditors();
    
    // Setup tab switching logic after editors are created
    setTimeout(() => {
        setupTabs();
        document.getElementById('bodyType').dispatchEvent(new Event('change'));
    }, 500); // Give Monaco time to initialize

    window.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.command === 'initData') {
            loadHistory(msg.history);
            loadEnvironments(msg.environments, msg.activeEnvironment);
        } else if (msg.command === 'response') {
            updateResponsePanel(msg);
        } else if (msg.command === 'loadHistory') {
            loadHistory(msg.history);
        }
    });
});