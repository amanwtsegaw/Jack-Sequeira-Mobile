const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const script = fs.readFileSync('src/components/androidReaderSelection.ts', 'utf8').split('String.raw`')[1].split('`;')[0];
const listeners = {};
let frames = [], reports = 0, lastPoint; const messages = [];
const text = {nodeType:3, length:40, textContent:'abcdefghijklmnopqrstuvwxyzabcdefghijklmn', parentElement:{closest:()=>true}};
function element() { return {style:{},dataset:{},children:[],setAttribute(){},append(...items){this.children.push(...items)},appendChild(item){this.children.push(item)}}; }
function range(start=0,end=start) { return {startContainer:text,endContainer:text,startOffset:start,endOffset:end,
  setStart(node,offset){this.startContainer=node;this.startOffset=offset},setEnd(node,offset){this.endContainer=node;this.endOffset=offset},
  collapse(toStart){if(toStart)this.endOffset=this.startOffset;else this.startOffset=this.endOffset},
  cloneRange(){return range(this.startOffset,this.endOffset)},
  compareBoundaryPoints(type,other){return this.startOffset-other.startOffset},
  getClientRects(){return [{left:(this.startOffset%10)*10,right:(this.endOffset%10)*10,top:Math.floor(this.startOffset/10)*20,height:20,width:(this.endOffset-this.startOffset)*10}]}
}; }
const context = {document:{body:element(),head:element(),createElement:element,createRange:()=>range(),
  addEventListener(name,fn){listeners[name]=fn},caretRangeFromPoint(x,y){Object.values(context.selectionHandles).forEach(handle=>assert.equal(handle.style.pointerEvents,'none','handles are excluded from hit testing'));assert.notEqual(context.selectionLayer.style.visibility,'hidden','selection stays visible during hit testing');lastPoint={x,y};return range(Math.max(0,Math.floor(y/20)*10+Math.round(x/10)))}},
  window:{scrollX:0,scrollY:0,getComputedStyle:()=>({direction:'ltr'}),addEventListener(){}},
  Node:{TEXT_NODE:3},Range:{START_TO_START:0},getSelectionBoundaryIndex:(_node,offset)=>offset,
  post(message){messages.push(message)}, setTimeout:()=>1,clearTimeout(){},requestAnimationFrame(fn){frames.push(fn);return frames.length},cancelAnimationFrame(){},reportSelection(){reports++}};
vm.createContext(context);vm.runInContext(script,context);
context.androidRange=range(1,4); context.paintAndroidSelection();
const endHandle=context.selectionHandles.end;
function event(x,y) {return {touches:[{clientX:x,clientY:y}],target:{closest:selector=>selector==='[data-selection-handle]'?endHandle:null},preventDefault(){}}}
listeners.touchstart(event(40,30)); // knob is 20px below the text's center
listeners.touchmove(event(50,30));
listeners.touchmove(event(60,30));
assert.equal(frames.length,1,'multiple moves share one animation frame');
frames.shift()();
assert.equal(lastPoint.y,10,'drag resolves on the text line, above the knob');
assert.equal(context.androidRange.endOffset,6,'end moves to an exact character');
assert.equal(context.selectionHandles.end,endHandle,'handle element is reused');
assert.equal(reports,0,'no React bridge update per animation frame');
listeners.touchmove(event(0,30)); frames.shift()();
assert.equal(context.androidRange.endOffset,6,'end cannot cross start');
listeners.touchend(event(0,30));
assert.equal(reports,1,'release reports the final selection immediately');
context.androidRange=range(1,10); context.paintAndroidSelection();
assert.equal(context.handleAnchors.end.y,10,'end at a line wrap stays on the preceding line');
console.log('Passed: drag offset, character boundary, frame batching, handle reuse, crossing guard, final report, wrapped endpoint.');

assert.equal(messages[0].dragging,true,'handle drag locks scrolling');
assert.equal(messages.at(-1).dragging,false,'release restores scrolling');
let prevented = false;
const swipe = (x,y) => ({touches:[{clientX:x,clientY:y}], target:{closest:()=>null}, preventDefault(){prevented=true}});
listeners.touchstart(swipe(50,50));
listeners.touchmove(swipe(50,110));
listeners.touchend(swipe(50,110));
assert.equal(prevented,false,'swiping selected text allows native scrolling');
assert.ok(context.androidRange,'scrolling keeps the selection');
console.log('Passed: scrolling unlocked after drag; swipe scrolls without clearing selection.');
const interruptedSwipe = (x,y) => ({touches:[{clientX:x,clientY:y,screenX:x,screenY:y}], target:{closest:()=>null}, preventDefault(){}});
listeners.touchstart(interruptedSwipe(50,50));
// Native ScrollView can consume move events; release coordinates still reveal a swipe.
listeners.touchend({...interruptedSwipe(50,100),changedTouches:[{screenX:50,screenY:100}]});
assert.ok(context.androidRange,'selection survives a swipe when native scrolling consumes move events');
listeners.touchcancel();
assert.ok(context.androidRange,'native touch cancellation preserves selection');
console.log('Passed: interrupted native swipe and touch cancellation preserve selection.');

const backgroundMark = context.selectionMarks[0];
assert.ok(context.selectionBackground.children.includes(backgroundMark),'selection color lives in its own background layer');
assert.ok(!context.selectionLayer.children.includes(backgroundMark),'color is separate from handles');
context.androidRange=range(1,10); context.paintAndroidSelection();
assert.equal(context.selectionMarks[0],backgroundMark,'background rectangles are reused');
context.androidRange=null;context.paintAndroidSelection();
assert.equal(backgroundMark.style.display,'none','dismissal hides selection background');
assert.ok(script.includes('.container { position: relative; z-index: 1; }'),'text remains above the selection background');
console.log('Passed: background painting, stable overlay reuse, and dismissal.');
// Use the production bridge reporter to check exact Android whitespace boundaries.
const contentSource = fs.readFileSync('src/components/BlockContent.tsx', 'utf8');
const reportSource = contentSource.slice(contentSource.indexOf('        function reportSelection()'), contentSource.indexOf('        var androidRange = null;')).replaceAll('\\\\', '\\');
context.window.getSelection = () => null;
context.documentKey = 'test-lesson';
vm.runInContext(reportSource, context);
for (const selectedText of [' word', 'word ', ' ', '  word  ']) {
  context.androidRange = range(2, 2 + selectedText.length);
  context.androidRange.toString = () => selectedText;
  context.reportSelection();
  const message = messages.at(-1);
  assert.equal(message.type, 'selection');
  assert.equal(message.selection.startIndex, 2);
  assert.equal(message.selection.endIndex, 1 + selectedText.length);
  assert.equal(message.selection.text, selectedText);
}
console.log('Passed: leading, trailing, repeated, and space-only selections retain exact boundaries.');
