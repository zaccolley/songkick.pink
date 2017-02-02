import runtime from 'serviceworker-webpack-plugin/lib/runtime';
import { h, render } from 'preact';
import './style';

let root;
function init() {
  if (process.env.NODE_ENV === 'production') {
    if ('serviceWorker' in navigator) {
      const registration = runtime.register();
    }
  }

  let App = require('./components/App').default;
  root = render(<App />, document.body, root);
}

init();

if (module.hot) {
  module.hot.accept('./components/App', () => requestAnimationFrame( () => {
    flushLogs();
    init();
  }) );

  // optional: mute HMR/WDS logs
  let log = console.log,
    logs = [];
  console.log = (t, ...args) => {
    if (typeof t==='string' && t.match(/^\[(HMR|WDS)\]/)) {
      if (t.match(/(up to date|err)/i)) logs.push(t.replace(/^.*?\]\s*/m,''), ...args);
    }
    else {
      log.call(console, t, ...args);
    }
  };
  let flushLogs = () => console.log(`%c🚀 ${logs.splice(0,logs.length).join(' ')}`, 'color:#888;');
}
