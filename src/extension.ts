import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

const HISTORY_KEY = 'requestHistory';
const ENVIRONMENTS_KEY = 'apiEnvironments';
const ACTIVE_ENVIRONMENT_KEY = 'activeEnvironment';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('testapi.runRequest', () => {
    const panel = vscode.window.createWebviewPanel(
      'testapi',
      'TestAPI - API Tester',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        // Set the root to the media directory to allow access to all its contents
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'media'))
        ]
      }
    );

    const htmlPath = path.join(context.extensionPath, 'media', 'panel.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    const scriptUri = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, 'media', 'main.js'))
    );

    // Get the URI for the Monaco loader script from the correct path
    const monacoLoaderUri = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, 'media', 'monaco-editor', 'vs', 'loader.js'))
    );

    // Get the base path for Monaco - point to the vs directory
    const monacoBaseUri = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, 'media', 'monaco-editor', 'vs'))
    );

    html = html.replace('{{mainScript}}', scriptUri.toString());
    html = html.replace('{{monacoLoader}}', monacoLoaderUri.toString());
    html = html.replace('{{monacoBase}}', monacoBaseUri.toString());
    panel.webview.html = html;

    // Send initial data to the webview
    const savedHistory = context.globalState.get<any[]>(HISTORY_KEY, []);
    const savedEnvironments = context.globalState.get<any[]>(ENVIRONMENTS_KEY, []);
    const activeEnvironment = context.globalState.get<string>(ACTIVE_ENVIRONMENT_KEY, 'default');
    
    panel.webview.postMessage({
      command: 'initData',
      history: savedHistory,
      environments: savedEnvironments,
      activeEnvironment: activeEnvironment
    });

    panel.webview.onDidReceiveMessage(async (message) => {
      // (Rest of your existing message handling logic)
      if (message.command === 'sendRequest') {
        try {
          // Save the request to history before sending
          const history = context.globalState.get<any[]>(HISTORY_KEY, []);
          history.unshift({
            timestamp: new Date().toISOString(),
            url: message.url,
            method: message.method,
            bodyType: message.bodyType,
            headers: message.headers,
            body: message.body,
          });

          if (history.length > 20) {
            history.pop();
          }

          await context.globalState.update(HISTORY_KEY, history);
          panel.webview.postMessage({ command: 'loadHistory', history: history });

          const startTime = Date.now();
          let options: any = { method: message.method, headers: message.headers || {} };

          if (message.bodyType === "formdata") {
            const form = new FormData();

            if (message.body.files) {
              for (const f of message.body.files) {
                form.append(f.field, Buffer.from(f.content, "base64"), f.name);
              }
            }
            if (message.body.fields) {
              for (const [k, v] of Object.entries(message.body.fields)) {
                form.append(k, v as any);
              }
            }
            options.body = form;
            delete options.headers["Content-Type"];
          } else if (message.body) {
            options.body = message.body;
          }

          const response = await fetch(message.url, options);
          const text = await response.text();
          const endTime = Date.now();
          const duration = endTime - startTime;
          const responseHeaders = Object.fromEntries(response.headers.entries());
          const size = Buffer.byteLength(text, 'utf8');

          panel.webview.postMessage({
            command: 'response',
            status: response.status,
            statusText: response.statusText,
            body: text,
            headers: responseHeaders,
            duration: duration,
            size: size
          });

        } catch (err: any) {
          panel.webview.postMessage({
            command: 'response',
            status: 'Error',
            statusText: 'Network Error',
            body: err.message,
            headers: {},
            duration: 0,
            size: 0
          });
        }
      } else if (message.command === 'saveEnvironments') {
        await context.globalState.update(ENVIRONMENTS_KEY, message.environments);
        await context.globalState.update(ACTIVE_ENVIRONMENT_KEY, message.activeEnvironment);
      }
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}