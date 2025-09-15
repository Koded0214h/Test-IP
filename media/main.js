const vscode = acquireVsCodeApi();

// --- Tab Switching Logic ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Deactivate all tabs and hide all content
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

    // Activate the clicked tab and show its content
    const tabName = tab.dataset.tab;
    document.getElementById(tabName + 'Content').classList.remove('hidden');
    tab.classList.add('active');
  });
});

// --- Body Type Switching Logic ---
document.getElementById('bodyType').addEventListener('change', (e) => {
  const type = e.target.value;
  const jsonRawSection = document.getElementById('bodyJsonRaw');
  const filesSection = document.getElementById('bodyFiles');

  // Hide all body sections first
  jsonRawSection.classList.add('hidden');
  filesSection.classList.add('hidden');

  // Show the relevant section based on the selected type
  if (type === "json" || type === "raw" || type === "urlencoded") {
    jsonRawSection.classList.remove('hidden');
  } else if (type === "formdata") {
    filesSection.classList.remove('hidden');
  }
});

// Set initial state for the body sections
document.getElementById('bodyType').dispatchEvent(new Event('change'));

// --- Send Button Logic ---
document.getElementById('sendBtn').addEventListener('click', () => {
  const method = document.getElementById('method').value;
  const url = document.getElementById('url').value;
  const authType = document.getElementById('authType').value;
  const authValue = document.getElementById('authValue').value;
  const headersText = document.getElementById('headersInput').value;
  const bodyType = document.getElementById('bodyType').value;

  let headers = {};
  try { headers = JSON.parse(headersText); } catch(e) { alert("Invalid headers JSON"); return; }

  // Inject authentication headers
  if (authType === "bearer") {
    headers["Authorization"] = "Bearer " + authValue;
  } else if (authType === "basic") {
    headers["Authorization"] = "Basic " + btoa(authValue);
  } else if (authType === "apikey") {
    // Assuming API Key is a single header name, like 'X-API-Key'
    headers["X-API-Key"] = authValue;
  }
  
  // Handle different body types
  if (bodyType === "formdata") {
    const files = document.getElementById('fileInput').files;
    const extraFieldsText = document.getElementById('extraFields').value;
    const serialized = { files: [], fields: {} };

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
      if (extraFieldsText) {
        serialized.fields = JSON.parse(extraFieldsText);
      }
    } catch (e) { 
      alert("Invalid JSON in extra fields"); 
      return; 
    }

    Promise.all(promises).then(() => {
      vscode.postMessage({
        command: 'sendRequest',
        method,
        url,
        headers,
        bodyType,
        body: serialized
      });
    }).catch(err => {
      alert("Error reading files: " + err.message);
    });
    return;
  }

  let body = null;
  if (bodyType !== "none") {
    body = document.getElementById('bodyInput').value;
    if (bodyType === "json") headers["Content-Type"] = "application/json";
    else if (bodyType === "urlencoded") headers["Content-Type"] = "application/x-www-form-urlencoded";
    else if (bodyType === "raw") headers["Content-Type"] = "text/plain";
  }

  vscode.postMessage({
    command: 'sendRequest',
    method,
    url,
    headers,
    bodyType,
    body
  });
});

// --- Message Listener for Response ---
window.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg.command === 'response') {
    document.getElementById('response').textContent =
      `Status: ${msg.status}\n\n${msg.body}`;
  }
});