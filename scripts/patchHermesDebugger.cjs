/* eslint-env node, es2022 */
// Minimal backport of https://github.com/meta/hermes/issues/2118 to .10.
// Keep the existing Hermes/JSI ABI rather than loading a newer, incompatible AAR.
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
if (!root)
  throw new Error(
    'Usage: node scripts/patchHermesDebugger.cjs <Hermes source directory>',
  );
function patch(file, before, after) {
  const target = path.join(root, file);
  const source = fs.readFileSync(target, 'utf8');
  if (source.includes(after)) return;
  if (source.split(before).length !== 2)
    throw new Error(
      `Unexpected Hermes source in ${file}; refusing an unsafe patch`,
    );
  fs.writeFileSync(target, source.replace(before, after));
}
const header = 'include/hermes/VM/Debugger/Debugger.h';
patch(
  header,
  '    auto bLoc = getLocationForState(b);\n',
  '    auto bLoc = getLocationForState(b);\n    if (!aLoc.hasValue() || !bLoc.hasValue()) {\n      return false;\n    }\n',
);
patch(
  header,
  '    return state.codeBlock->getSourceLocation(state.offset);',
  '    if (!state.codeBlock) {\n      return llvh::None;\n    }\n    return state.codeBlock->getSourceLocation(state.offset);',
);
patch(
  'lib/VM/Debugger/Debugger.cpp',
  '            curStepMode_ ? PauseReason::StepFinish : *asyncTriggerPauseReason_;',
  '            asyncTriggerPauseReason_ ? *asyncTriggerPauseReason_ : PauseReason::StepFinish;',
);
console.log('Applied Hermes debugger null-state guards.');
