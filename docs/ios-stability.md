# iOS crash investigation — October 28, 2026

The three simulator crash reports at 15:52:56, 16:12:57, and 16:17:09 show
`EXC_BAD_ACCESS` in Hermes `CodeBlock::getSourceLocation`, reached through
`Debugger::runUntilValidPauseLocation` and `RuntimeDomainAgent::evaluate`.
These coincide with direct debugger evaluation used during automated inspection.

Subsequent testing avoids that inspection path. It uses normal simulator launches,
native screenshots, component tests, and the reproducible check below. The app's
JavaScript engine and normal developer tools have not been replaced.

After rebuilding and installing the app, run:

```sh
node scripts/checkIosLaunchStability.cjs
```

The check verifies three cold launches, then watches the final process for 30
seconds and checks for newly generated app crash reports. This passed after the
font and layout changes. It verifies normal startup stability; it does not claim
to cover every possible user interaction.
