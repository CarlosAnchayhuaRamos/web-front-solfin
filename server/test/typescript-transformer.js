const ts = require('typescript');

module.exports = {
  process(sourceText, sourcePath) {
    return { code: ts.transpileModule(sourceText, {
      fileName: sourcePath,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true, emitDecoratorMetadata: true, inlineSourceMap: true, inlineSources: true },
    }).outputText };
  },
};
