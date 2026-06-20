---
description: Analyze a file and generate precise TSDoc/JSDoc block comments
agent: build
---

File Path: $ARGUMENTS
File Contents:
@$ARGUMENTS

Analyze the file contents:
1. Identify all public exports, components, interfaces, classes, and complex inner helper functions.
2. Generate standard TSDoc/JSDoc comment blocks, detailing parameters (`@param`), return types (`@returns`), throw behaviors (`@throws`), and examples (`@example`).
3. Focus strictly on undocumented or logically dense sections. Do not add comments for trivial names.
4. Output only the updated file contents or the comment insertions.
