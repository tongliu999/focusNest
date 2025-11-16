
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as monaco from 'monaco-editor';

// @ts-ignore
self.MonacoEnvironment = {
	getWorkerUrl: function (_moduleId: any, label: string) {
		if (label === 'json') {
			return 'https://aistudiocdn.com/monaco-editor@0.44.0/esm/vs/language/json/json.worker.js';
		}
		if (label === 'css' || label === 'scss' || label === 'less') {
			return 'https://aistudiocdn.com/monaco-editor@0.44.0/esm/vs/language/css/css.worker.js';
		}
		if (label === 'html' || label === 'handlebars' || label === 'razor') {
			return 'https://aistudiocdn.com/monaco-editor@0.44.0/esm/vs/language/html/html.worker.js';
		}
		if (label === 'typescript' || label === 'javascript') {
			return 'https://aistudiocdn.com/monaco-editor@0.44.0/esm/vs/language/typescript/ts.worker.js';
		}
		return 'https://aistudiocdn.com/monaco-editor@0.44.0/esm/vs/editor/editor.worker.js';
	},
};


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
