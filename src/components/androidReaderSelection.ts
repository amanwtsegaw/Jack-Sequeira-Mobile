// Runs inside the reader WebView, where DOM ranges provide text geometry.
export const androidReaderSelectionScript = String.raw`
var androidRange = null;
var selectionLayer = document.createElement('div');
selectionLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1000;';
document.body.appendChild(selectionLayer);
document.body.style.userSelect = 'none';
document.body.style.webkitUserSelect = 'none';
var pressTimer, origin, dragging = null, held = false, moved = false;
var dragOffset = null, dragPoint = null, dragFrame = null;
var selectionMarks = [], selectionHandles = {}, handleAnchors = {};
// Paint behind the glyphs: moving a boundary must not restyle reader text.
var selectionBackground = document.createElement('div');
selectionBackground.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;';
document.body.appendChild(selectionBackground);
var selectionStyle = document.createElement('style');
selectionStyle.textContent = 'body { isolation: isolate; } .container { position: relative; z-index: 1; }';
document.head.appendChild(selectionStyle);
function pointBoundary(x, y) {
  // Handles overlap nearby characters. Exclude them from Android's caret hit test.
  var handles = Object.keys(selectionHandles).map(function (edge) { return selectionHandles[edge]; });
  handles.forEach(function (handle) { handle.style.pointerEvents = 'none'; });
  var range;
  try { range = document.caretRangeFromPoint(x, y); }
  finally { handles.forEach(function (handle) { handle.style.pointerEvents = 'auto'; }); }
  if (!range) return null;
  var element = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer;
  if (!element || !element.closest || !element.closest('[data-text-node="1"]')) return null;
  return { node: range.startContainer, offset: range.startOffset };
}
function endpointRect(edge) {
  var caret = androidRange.cloneRange();
  caret.collapse(edge === 'start');
  // At a wrapped line boundary, use the selected character's line.
  var node = edge === 'start' ? androidRange.startContainer : androidRange.endContainer;
  var offset = edge === 'start' ? androidRange.startOffset : androidRange.endOffset;
  if (node.nodeType === Node.TEXT_NODE &&
      (edge === 'start' ? offset < node.length : offset > 0)) {
    caret.setStart(node, edge === 'start' ? offset : offset - 1);
    caret.setEnd(node, edge === 'start' ? offset + 1 : offset);
    var rects = caret.getClientRects();
    var glyph = rects[edge === 'start' ? 0 : rects.length - 1];
    if (glyph) {
      var rtl = window.getComputedStyle(node.parentElement).direction === 'rtl';
      return {left: (edge === 'start') !== rtl ? glyph.left : glyph.right,
        top: glyph.top, height: glyph.height};
    }
  }
  return caret.getClientRects()[0];
}
function paintAndroidSelection() {
  if (!androidRange) {
    selectionMarks.forEach(function (mark) { mark.style.display = 'none'; });
    Object.keys(selectionHandles).forEach(function (edge) { selectionHandles[edge].style.display = 'none'; });
    handleAnchors = {};
    return;
  }
  // Read geometry before changing styles to avoid repeated layout work.
  var rects = Array.from(androidRange.getClientRects());
  var endpoints = {start: endpointRect('start'), end: endpointRect('end')};
  rects.forEach(function (rect, index) {
    var mark = selectionMarks[index];
    if (!mark) {
      mark = document.createElement('div');
      mark.style.cssText = 'position:absolute;background:rgba(70,140,220,.3);';
      selectionBackground.appendChild(mark);
      selectionMarks.push(mark);
    }
    Object.assign(mark.style, {display: 'block', left: rect.left + window.scrollX + 'px', top: rect.top + window.scrollY + 'px', width: rect.width + 'px', height: rect.height + 'px'});
  });
  selectionMarks.slice(rects.length).forEach(function (mark) { mark.style.display = 'none'; });
  ['start', 'end'].forEach(function (edge) {
    var rect = endpoints[edge];
    var handle = selectionHandles[edge];
    if (!rect) { if (handle) handle.style.display = 'none'; return; }
    if (!handle) {
      handle = document.createElement('div');
      handle.dataset.selectionHandle = edge;
      handle.setAttribute('role', 'slider');
      handle.setAttribute('aria-label', edge === 'start' ? 'Selection start' : 'Selection end');
      handle.style.cssText = 'position:absolute;width:44px;pointer-events:auto;touch-action:none;';
      var stem = document.createElement('div');
      stem.style.cssText = 'position:absolute;left:21px;width:2px;background:#287bd1;';
      var knob = document.createElement('div');
      knob.style.cssText = 'position:absolute;left:13px;width:18px;height:18px;border-radius:50%;background:#287bd1;';
      handle.append(stem, knob);
      selectionLayer.appendChild(handle);
      selectionHandles[edge] = handle;
    }
    handleAnchors[edge] = {x: rect.left, y: rect.top + rect.height / 2};
    Object.assign(handle.style, {display:'block', left: rect.left + window.scrollX - 22 + 'px', top: rect.top + window.scrollY + 'px', height: rect.height + 26 + 'px'});
    handle.children[0].style.height = rect.height + 'px';
    handle.children[1].style.top = rect.height + 'px';
  });
}
function updateAndroidDrag() {
  dragFrame = null;
  if (!dragging || !androidRange || !dragPoint) return;
  var point = pointBoundary(dragPoint.x - dragOffset.x, dragPoint.y - dragOffset.y);
  dragPoint = null;
  if (!point) return;
  // DOM boundary comparison avoids counting all preceding text on every move.
  var candidate = document.createRange();
  candidate.setStart(point.node, point.offset); candidate.collapse(true);
  var opposite = androidRange.cloneRange();
  opposite.collapse(dragging === 'end');
  var comparison = candidate.compareBoundaryPoints(Range.START_TO_START, opposite);
  if (dragging === 'start') {
    if (comparison >= 0 || (point.node === androidRange.startContainer && point.offset === androidRange.startOffset)) return;
    androidRange.setStart(point.node, point.offset);
  } else {
    if (comparison <= 0 || (point.node === androidRange.endContainer && point.offset === androidRange.endOffset)) return;
    androidRange.setEnd(point.node, point.offset);
  }
  paintAndroidSelection();

}
function finishAndroidDrag() {
  if (dragFrame !== null) cancelAnimationFrame(dragFrame);
  dragFrame = null;
  if (dragging && dragPoint) updateAndroidDrag();

  if (dragging && androidRange) reportSelection();
  if (dragging) post({ type: 'selectionDrag', dragging: false });
  dragging = null; dragPoint = null; dragOffset = null; origin = null;
}
document.addEventListener('contextmenu', function (event) { event.preventDefault(); });
document.addEventListener('touchstart', function (event) {
  if (event.touches.length !== 1 || event.target.closest('input,textarea,button')) return;
  var touch = event.touches[0];
  origin = {x: touch.clientX, y: touch.clientY, screenX: touch.screenX, screenY: touch.screenY};
  held = false; moved = false;
  var handle = event.target.closest('[data-selection-handle]');
  dragging = handle ? handle.dataset.selectionHandle : null;
  if (dragging) {
    var anchor = handleAnchors[dragging];
    if (!anchor) { dragging = null; return; }
    dragOffset = {x: touch.clientX - anchor.x, y: touch.clientY - anchor.y};
    post({ type: 'selectionDrag', dragging: true });
    event.preventDefault(); return;
  }
  if (androidRange) return;
  pressTimer = setTimeout(function () {
    if (!origin) return;
    var point = pointBoundary(origin.x, origin.y);
    if (!point || point.node.nodeType !== Node.TEXT_NODE) return;
    var text = point.node.textContent;
    var start = Math.min(point.offset, Math.max(0, text.length - 1)), end = start;
    while (start > 0 && !/\s/.test(text[start - 1])) start--;
    while (end < text.length && !/\s/.test(text[end])) end++;
    if (start === end) return;
    androidRange = document.createRange();
    androidRange.setStart(point.node, start); androidRange.setEnd(point.node, end);
    held = true; paintAndroidSelection(); reportSelection();
  }, 280);
}, {passive:false});
document.addEventListener('touchmove', function (event) {
  var touch = event.touches[0];
  if (!touch || !origin) return;
  if (Math.hypot(touch.clientX-origin.x,touch.clientY-origin.y)>6) { moved = true; clearTimeout(pressTimer); }
  if (dragging && androidRange) {
    event.preventDefault();
    dragPoint = {x: touch.clientX, y: touch.clientY};
    if (dragFrame === null) dragFrame = requestAnimationFrame(updateAndroidDrag);
  } else if (held) event.preventDefault();
}, {passive:false});
document.addEventListener('touchend', function (event) {
  clearTimeout(pressTimer);
  var released = event.changedTouches && event.changedTouches[0];
  if (released && origin && Math.hypot(released.screenX - origin.screenX, released.screenY - origin.screenY) > 6) moved = true;
  if (dragging || held) { event.preventDefault(); }
  else if (androidRange && !moved && origin) { event.preventDefault(); window.__clearReaderSelection(); }
  finishAndroidDrag();
}, {passive:false});
document.addEventListener('touchcancel', function () { clearTimeout(pressTimer); finishAndroidDrag(); });
window.addEventListener('resize', paintAndroidSelection);
`;
