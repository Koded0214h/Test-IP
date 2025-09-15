import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('testapi.runRequest', () => {
    const panel = vscode.window.createWebviewPanel(
      'testapi',
      'TestAPI - API Tester',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
      }
    );

    const htmlPath = path.join(context.extensionPath, 'media', 'panel.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    const scriptUri = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, 'media', 'main.js'))
    );

    html = html.replace('{{mainScript}}', scriptUri.toString());
    panel.webview.html = html;

    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'sendRequest') {
        try {
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
            delete options.headers["Content-Type"]; // let form-data set boundary
          } else if (message.body) {
            options.body = message.body;
          }

          const response = await fetch(message.url, options);
          const text = await response.text();

          panel.webview.postMessage({
            command: 'response',
            status: response.status,
            body: text
          });
        } catch (err: any) {
          panel.webview.postMessage({
            command: 'response',
            status: 'Error',
            body: err.message
          });
        }
      }
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
