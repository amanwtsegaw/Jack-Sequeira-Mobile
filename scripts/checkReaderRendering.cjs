/* eslint-env node, es2022 */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const ts = require('typescript');

// Exercise the actual bridge renderer, including overlapping annotation ranges.
const source = fs.readFileSync('src/components/BlockContent.tsx', 'utf8');
const sync = source.slice(
  source.indexOf('        window.__syncReaderHighlights ='),
  source.indexOf('        function getSelectionBoundaryIndex'),
);
// A long WebView viewport must not prevent content shrinking after fonts settle.
let contentBottom = 1200;
const heights = [];
const heightContext = {
  document: {
    querySelector: () => ({
      getBoundingClientRect: () => ({ bottom: contentBottom }),
    }),
  },
  window: { scrollY: 0 },
  post: message => heights.push(message.height),
};
vm.runInNewContext(
  source.slice(
    source.indexOf('        var lastReportedHeight ='),
    source.indexOf('        function reportSettledHeight'),
  ),
  heightContext,
);
heightContext.reportHeight();
heightContext.reportHeight();
contentBottom = 800;
heightContext.reportHeight();
assert.deepEqual(
  heights,
  [1200, 800],
  'reports only changed content heights and allows shrinking',
);
console.log(
  'PASS: content height shrinks after font loading and duplicate height messages are suppressed.',
);

function element(text = '') {
  return {
    style: {},
    attributes: {},
    children: [],
    _text: text,
    get textContent() {
      return (
        this._text + this.children.map(child => child.textContent).join('')
      );
    },
    set textContent(value) {
      this._text = value;
      this.children = [];
    },
    getAttribute(key) {
      return this.attributes[key];
    },
    setAttribute(key, value) {
      this.attributes[key] = value;
    },
    appendChild(child) {
      this.children.push(child);
    },
  };
}
const node = element('A😀bcdefghi');
node.attributes = { 'data-start-index': '0', 'data-end-index': '9' };
const context = {
  window: {},
  document: {
    querySelectorAll: () => [node],
    createElement: () => element(),
    createTextNode: element,
  },
};
vm.runInNewContext(sync, context);
const note = {
  id: 'note',
  text: 'A😀bcdefghi',
  startIndex: 0,
  endIndex: 9,
  style: 'underline',
  note: 'Keep this note',
  underlineColor: '#123456',
};
const highlight = {
  id: 'color',
  startIndex: 2,
  endIndex: 5,
  backgroundColor: '#FFF3A3',
  textColor: '#000000',
};
for (const items of [
  [highlight, note],
  [note, highlight],
]) {
  context.window.__syncReaderHighlights(items);
  assert.equal(node.textContent, 'A😀bcdefghi');
  const colored = node.children.find(child => child.style.backgroundColor);
  assert.equal(colored.textContent, 'bcde');
  assert.equal(colored.style.textDecorationLine, 'underline');
  assert.equal(colored.getAttribute('data-highlight-id'), 'note');
  assert.equal(colored.getAttribute('data-highlight-note'), 'Keep this note');
}
context.window.__syncReaderHighlights([note]);
assert.equal(node.children[0].style.textDecorationLine, 'underline');
assert.equal(node.children[0].style.backgroundColor, undefined);
context.window.__syncReaderHighlights([]);
assert.equal(node.textContent, 'A😀bcdefghi');
console.log(
  'PASS: partial highlights over notes, annotation order, Unicode boundaries, note preservation, removal.',
);

const lessonSource = fs.readFileSync(
  'src/app/screens/LessonScreen.tsx',
  'utf8',
);
const builderSource = lessonSource.slice(
  lessonSource.indexOf('export function buildShareImageCanvasHtml'),
  lessonSource.indexOf('function buildShareImageFileName'),
);
const compiled = ts.transpileModule(builderSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const moduleContext = { exports: {} };
vm.runInNewContext(compiled, moduleContext);
const builder = moduleContext.exports.buildShareImageCanvasHtml;
async function checkExport(family, fail = false) {
  const html = builder({
    text: 'A quote </script> ጸጋ',
    seriesTitle: 'Series',
    lessonTitle: 'Chapter',
    size: { width: 1080, height: 1080 },
    theme: {
      background: '#111111',
      panel: '#222222',
      accent: '#333333',
      line: '#444444',
      foreground: '#ffffff',
      muted: '#aaaaaa',
    },
    fontSize: 60,
    minFontSize: 30,
    typography: { reading: family, ui: family },
    fonts: [{ family, base64: 'font-bytes' }],
  });
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const messages = [],
    drawnFonts = [],
    loaded = [];
  let finishLoad;
  const loadGate = new Promise(resolve => {
    finishLoad = resolve;
  });
  const ctx = new Proxy(
    {
      measureText: value => ({ width: value.length * 20 }),
      fillText() {
        drawnFonts.push(this.font);
      },
    },
    { get: (target, key) => (key in target ? target[key] : () => {}) },
  );
  vm.runInNewContext(script, {
    FontFace: class {
      constructor(name) {
        this.name = name;
      }
      async load() {
        await loadGate;
        if (fail) throw Error('Font load failed');
        loaded.push(this.name);
        return this;
      }
    },
    document: {
      fonts: { add() {}, ready: Promise.resolve() },
      getElementById: () => ({
        getContext: () => ctx,
        toDataURL: () => 'data:image/png;base64,ok',
      }),
    },
    window: {
      ReactNativeWebView: {
        postMessage: message => messages.push(JSON.parse(message)),
      },
    },
  });
  assert.equal(
    drawnFonts.length,
    0,
    'nothing is rendered before the font loads',
  );
  finishLoad();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(
    messages[0].type,
    fail ? 'quoteExportError' : 'quoteExportReady',
  );
  if (fail)
    assert.equal(
      drawnFonts.length,
      0,
      'failed font loading never produces a fallback-font image',
    );
  else {
    assert.deepEqual(loaded, [family]);
    assert.ok(drawnFonts.length > 0);
    assert.ok(drawnFonts.every(font => font.endsWith(JSON.stringify(family))));
  }
}
(async () => {
  for (const family of [
    'Cabin-Regular',
    'Cabin_Condensed-Regular',
    'Raedex',
    'Lexend-Regular',
    'Quicksand-Regular',
    'Menbere-Regular',
    'NokiaPureHeadline-Regular',
  ])
    await checkExport(family);
  await checkExport('Cabin-Regular', true);
  console.log(
    'PASS: all seven export fonts, wait before measuring/drawing, script-safe text, and explicit font failure.',
  );
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
