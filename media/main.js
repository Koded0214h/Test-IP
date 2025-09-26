const vscode = acquireVsCodeApi();

let headersEditor, bodyEditor, paramsEditor, formFieldsEditor;
let environments = {};
let activeEnvironment = 'default';
let monacoInitialized = false;
let currentHistory = [];
let selectedFiles = [];

// --- Monaco Editor Initialization ---
function initMonacoEditors() {
    console.log('Initializing Monaco editors...');
    
    if (window.monaco && window.monaco.editor) {
        createEditors();
        return;
    }

    require.config({ 
        paths: { 
            'vs': window.MONACO_BASE
        },
        waitSeconds: 30
    });

    require(['vs/editor/editor.main'], function() {
        console.log('Monaco editor loaded successfully');
        createEditors();
    }, function(error) {
        console.error('Failed to load Monaco editor:', error);
        fallbackToTextareas();
    });
}

function createEditors() {
    try {
        // Params Editor
        paramsEditor = monaco.editor.create(document.getElementById('paramsEditor'), {
            value: '{\n    \n}',
            language: 'json',
            theme: 'vs-dark',
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineHeight: 18
        });

        // Headers Editor
        headersEditor = monaco.editor.create(document.getElementById('headersEditor'), {
            value: '{\n    "Content-Type": "application/json"\n}',
            language: 'json',
            theme: 'vs-dark',
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineHeight: 18
        });

        // Body Editor
        bodyEditor = monaco.editor.create(document.getElementById('bodyEditor'), {
            value: '{\n    \n}',
            language: 'json',
            theme: 'vs-dark',
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineHeight: 18
        });

        // Form Fields Editor
        formFieldsEditor = monaco.editor.create(document.getElementById('formFieldsEditor'), {
            value: '{\n    \n}',
            language: 'json',
            theme: 'vs-dark',
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineHeight: 18
        });

        monacoInitialized = true;
        console.log('All Monaco editors created successfully');
        setupResizeHandling();

    } catch (error) {
        console.error('Error creating Monaco editors:', error);
        fallbackToTextareas();
    }
}

function fallbackToTextareas() {
    console.log('Falling back to textareas');
    
    const containers = {
        'paramsEditor': '{\n    \n}',
        'headersEditor': '{\n    "Content-Type": "application/json"\n}',
        'bodyEditor': '{\n    \n}',
        'formFieldsEditor': '{\n    \n}'
    };

    for (const [id, value] of Object.entries(containers)) {
        const container = document.getElementById(id);
        if (container) {
            const textarea = document.createElement('textarea');
            textarea.style.width = '100%';
            textarea.style.height = '200px';
            textarea.style.fontFamily = 'monospace';
            textarea.style.backgroundColor = '#1e1e1e';
            textarea.style.color = '#d4d4d4';
            textarea.style.border = '1px solid #3e3e42';
            textarea.style.padding = '8px';
            textarea.style.borderRadius = '4px';
            textarea.value = value;
            container.innerHTML = '';
            container.appendChild(textarea);
        }
    }
}

function setupResizeHandling() {
    const resizeObserver = new ResizeObserver(() => {
        if (paramsEditor) paramsEditor.layout();
        if (headersEditor) headersEditor.layout();
        if (bodyEditor) bodyEditor.layout();
        if (formFieldsEditor) formFieldsEditor.layout();
    });

    document.querySelectorAll('.monaco-editor-container').forEach(container => {
        resizeObserver.observe(container);
    });
}

// --- File Upload Management ---
function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    
    if (!fileInput || !fileList) return;

    fileInput.addEventListener('change', function(e) {
        Array.from(e.target.files).forEach(file => {
            addFileToList(file);
        });
        // Clear the input to allow selecting the same file again
        fileInput.value = '';
    });
}

function addFileToList(file) {
    // Check if file already exists
    if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        return;
    }

    selectedFiles.push(file);
    updateFileListUI();
}

function removeFileFromList(index) {
    selectedFiles.splice(index, 1);
    updateFileListUI();
}

function updateFileListUI() {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;

    fileList.innerHTML = '';
    
    if (selectedFiles.length === 0) {
        fileList.innerHTML = '<div style="color: var(--text-muted); font-style: italic;">No files selected</div>';
        return;
    }

    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileSize = formatFileSize(file.size);
        
        fileItem.innerHTML = `
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div class="file-size">${fileSize}</div>
            <button class="remove-file" data-index="${index}">×</button>
        `;
        
        fileList.appendChild(fileItem);
    });

    // Add event listeners to remove buttons
    fileList.querySelectorAll('.remove-file').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            removeFileFromList(index);
        });
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// --- Body Type Handling ---
function setupBodyTypeHandling() {
    const bodyTypeSelect = document.getElementById('bodyType');
    if (!bodyTypeSelect) return;

    bodyTypeSelect.addEventListener('change', () => {
        const type = bodyTypeSelect.value;
        const jsonRawSection = document.getElementById('bodyJsonRaw');
        const formDataSection = document.getElementById('bodyFormData');
        
        // Hide all sections first
        jsonRawSection.classList.add('hidden');
        formDataSection.classList.add('hidden');
        
        // Show relevant section
        if (type === 'json' || type === 'raw' || type === 'urlencoded') {
            jsonRawSection.classList.remove('hidden');
            
            // Update body editor language
            if (bodyEditor && monacoInitialized) {
                const language = type === "json" ? "json" : "plaintext";
                monaco.editor.setModelLanguage(bodyEditor.getModel(), language);
            }
        } else if (type === 'formdata') {
            formDataSection.classList.remove('hidden');
        }
        
        // Update editors layout
        setTimeout(() => {
            if (bodyEditor) bodyEditor.layout();
            if (formFieldsEditor) formFieldsEditor.layout();
        }, 100);
    });
}

// --- Tab Management ---
function setupTabs() {
    // Left sidebar tabs (History/Environments)
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabName = tab.dataset.tab;
            document.getElementById('historyList').classList.toggle('hidden', tabName !== 'history');
            document.getElementById('envList').classList.toggle('hidden', tabName !== 'environments');
        });
    });

    // Left panel tabs (Params, Auth, Headers, Body)
    document.querySelectorAll('.left-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.left-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Hide all tab panels
            document.querySelectorAll('#paramsContent, #authContent, #headersContent, #bodyContent')
                .forEach(panel => panel.classList.add('hidden'));
            
            // Show active panel
            const tabName = tab.dataset.tab;
            document.getElementById(tabName + 'Content').classList.remove('hidden');
            
            // Update editors layout
            setTimeout(() => {
                if (paramsEditor) paramsEditor.layout();
                if (headersEditor) headersEditor.layout();
                if (bodyEditor) bodyEditor.layout();
                if (formFieldsEditor) formFieldsEditor.layout();
            }, 100);
        });
    });

    // Response tabs
    document.querySelectorAll('.response-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.response-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('#responseBody, #responseHeaders, #responseCookies')
                .forEach(panel => panel.classList.add('hidden'));
            
            const tabName = tab.dataset.tab.replace('response', '').toLowerCase();
            document.getElementById('response' + tabName.charAt(0).toUpperCase() + tabName.slice(1))
                .classList.remove('hidden');
        });
    });
}

// --- Environment Management ---
function loadEnvironments(envs, activeEnv) {
    environments = envs || {};
    activeEnvironment = activeEnv || 'default';
    
    const envList = document.getElementById('envList');
    if (envList) {
        envList.innerHTML = '';
        Object.keys(environments).forEach(key => {
            const envItem = document.createElement('div');
            envItem.className = 'env-item';
            envItem.innerHTML = `
                <strong>${key}</strong>
                <div class="history-item-details">${Object.keys(environments[key]).length} variables</div>
            `;
            envItem.addEventListener('click', () => switchEnvironment(key));
            envList.appendChild(envItem);
        });
    }
}

function switchEnvironment(envName) {
    activeEnvironment = envName;
    // Highlight active environment in UI
    document.querySelectorAll('.env-item').forEach(item => {
        item.style.background = item.textContent.includes(envName) ? 'var(--hover)' : '';
    });
}

function saveEnvironments() {
    vscode.postMessage({ 
        command: 'saveEnvironments', 
        environments, 
        activeEnvironment 
    });
}

// --- History Management ---
function loadHistory(history) {
    currentHistory = history || [];
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    historyList.innerHTML = '';
    currentHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <strong>${item.method}</strong> ${item.url}
            <div class="history-item-details">${new Date(item.timestamp).toLocaleString()}</div>
        `;
        historyItem.addEventListener('click', () => loadRequestFromHistory(item));
        historyList.appendChild(historyItem);
    });
}

function loadRequestFromHistory(request) {
    // Load basic request info
    document.getElementById('method').value = request.method || 'GET';
    document.getElementById('url').value = request.url || '';
    
    // Load auth
    if (request.authType) {
        document.getElementById('authType').value = request.authType;
        document.getElementById('authValue').value = request.authValue || '';
    }
    
    // Load headers
    if (headersEditor && monacoInitialized) {
        headersEditor.setValue(JSON.stringify(request.headers || {}, null, 2));
    }
    
    // Load body
    const bodyTypeSelect = document.getElementById('bodyType');
    if (bodyTypeSelect && request.bodyType) {
        bodyTypeSelect.value = request.bodyType;
        bodyTypeSelect.dispatchEvent(new Event('change'));
        
        if (bodyEditor && monacoInitialized && request.bodyType !== 'formdata') {
            bodyEditor.setValue(request.body || '');
        }
        
        // Load form data if applicable
        if (request.bodyType === 'formdata' && formFieldsEditor && monacoInitialized) {
            formFieldsEditor.setValue(JSON.stringify(request.body?.fields || {}, null, 2));
        }
    }
    
    // Switch to body tab
    document.querySelector('.left-tab[data-tab="body"]').click();
}

// --- Variable Processing ---
function processVariables(data) {
    if (typeof data !== 'string' || !environments[activeEnvironment]) return data;
    
    let processedData = data;
    const variables = environments[activeEnvironment];
    
    for (const key in variables) {
        if (typeof variables[key] === 'string') {
            const placeholder = `{{${key}}}`;
            processedData = processedData.replace(new RegExp(placeholder, 'g'), variables[key]);
        }
    }
    
    return processedData;
}

// --- Request Sending with File Upload ---
document.getElementById('sendBtn').addEventListener('click', sendRequest);

async function sendRequest() {
    const method = document.getElementById('method').value;
    let url = document.getElementById('url').value;
    
    if (!url) {
        alert('Please enter a URL');
        return;
    }

    // Process URL with variables
    url = processVariables(url);

    // Get headers
    const headersText = getEditorValue(headersEditor, monacoInitialized) || '{}';
    let headers = {};
    try {
        headers = JSON.parse(processVariables(headersText));
    } catch(e) {
        alert("Invalid headers JSON");
        return;
    }

    // Handle authentication
    const authType = document.getElementById('authType').value;
    const authValue = document.getElementById('authValue').value;
    
    if (authType === "bearer" && authValue.trim()) {
        headers["Authorization"] = "Bearer " + processVariables(authValue.trim());
    } else if (authType === "basic" && authValue.trim()) {
        headers["Authorization"] = "Basic " + btoa(processVariables(authValue.trim()));
    } else if (authType === "apikey" && authValue.trim()) {
        headers["X-API-Key"] = processVariables(authValue.trim());
    }

    // Get body based on type
    const bodyType = document.getElementById('bodyType').value;
    let body = null;
    let bodyData = null;

    if (bodyType === "formdata") {
        // Handle multipart form data with files
        bodyData = await prepareFormData();
        if (!bodyData) return; // Preparation failed
        
    } else if (bodyType !== "none") {
        const bodyText = getEditorValue(bodyEditor, monacoInitialized) || '';
        if (bodyText.trim()) {
            body = processVariables(bodyText);
            
            // Set appropriate content type
            if (bodyType === "json" && !headers['Content-Type']) {
                headers["Content-Type"] = "application/json";
            } else if (bodyType === "raw" && !headers['Content-Type']) {
                headers["Content-Type"] = "text/plain";
            } else if (bodyType === "urlencoded" && !headers['Content-Type']) {
                headers["Content-Type"] = "application/x-www-form-urlencoded";
            }
        }
    }

    // Send message to extension
    vscode.postMessage({
        command: 'sendRequest',
        method,
        url,
        headers,
        bodyType,
        body: bodyData || body,
        authType,
        authValue
    });
}

async function prepareFormData() {
    const formFieldsText = getEditorValue(formFieldsEditor, monacoInitialized) || '{}';
    let fields = {};
    
    try {
        if (formFieldsText.trim()) {
            fields = JSON.parse(processVariables(formFieldsText));
        }
    } catch(e) {
        alert("Invalid JSON in form fields");
        return null;
    }

    // Prepare files data
    const filesData = [];
    
    for (const file of selectedFiles) {
        try {
            const fileData = await readFileAsBase64(file);
            filesData.push({
                name: file.name,
                field: "file", // You can make this configurable if needed
                content: fileData,
                type: file.type
            });
        } catch(error) {
            alert(`Error reading file ${file.name}: ${error.message}`);
            return null;
        }
    }

    return {
        fields: fields,
        files: filesData
    };
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove the data:application/octet-stream;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// --- Response Handling ---
function updateResponsePanel(msg) {
    const bodyEl = document.getElementById('responseBody');
    const headersEl = document.getElementById('responseHeaders');
    
    if (!bodyEl || !headersEl) return;

    // Format response body
    let formattedBody = msg.body || '';
    const contentType = msg.headers?.['content-type'] || '';
    
    if (contentType.includes('application/json')) {
        try {
            formattedBody = JSON.stringify(JSON.parse(msg.body), null, 2);
        } catch (e) {
            formattedBody = "Invalid JSON\n\n" + msg.body;
        }
    }
    
    bodyEl.textContent = formattedBody;
    
    // Format headers
    if (msg.headers) {
        headersEl.textContent = Object.entries(msg.headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n');
    }
    
    // Update status badge
    const statusTab = document.querySelector('.response-tab[data-tab="responseBody"]');
    if (statusTab && msg.status) {
        const statusClass = Math.floor(msg.status / 100);
        statusTab.innerHTML = `Body <span class="status-badge status-${statusClass}xx">${msg.status}</span>`;
    }
}

// --- Helper Functions ---
function getEditorValue(editor, isMonaco = true) {
    if (isMonaco && editor) {
        return editor.getValue();
    } else if (!isMonaco) {
        const textarea = document.querySelector(`#${editor} textarea`);
        return textarea ? textarea.value : '';
    }
    return '';
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Monaco editors
    setTimeout(initMonacoEditors, 100);
    
    // Setup UI components
    setTimeout(() => {
        setupTabs();
        setupBodyTypeHandling();
        setupFileUpload();
        
        // Load initial data from extension
        vscode.postMessage({ command: 'getInitialData' });
    }, 500);

    // Handle messages from extension
    window.addEventListener('message', (event) => {
        const msg = event.data;
        
        switch (msg.command) {
            case 'initData':
                loadHistory(msg.history);
                loadEnvironments(msg.environments, msg.activeEnvironment);
                break;
                
            case 'response':
                updateResponsePanel(msg);
                break;
                
            case 'loadHistory':
                loadHistory(msg.history);
                break;
        }
    });
});