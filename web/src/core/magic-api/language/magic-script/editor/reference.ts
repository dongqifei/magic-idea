import * as monaco from 'monaco-editor';

const ReferenceProvider = {
  provideReferences: function (model, position) {
    const wordInfo = model.getWordAtPosition(position);
    if (!wordInfo) return [];

    const word = wordInfo.word;
    const references: monaco.languages.Location[] = [];

    const lineCount = model.getLineCount();
    for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
      const lineContent = model.getLineContent(lineNumber);
      let matchIndex = 0;
      // 使用正则查找所有匹配项
      const regex = new RegExp(`\\b${word}\\b`, "g");
      let match;
      while ((match = regex.exec(lineContent)) !== null) {
        matchIndex = match.index;
        references.push({
          uri: model.uri,
          range: new monaco.Range(
            lineNumber,
            matchIndex + 1,
            lineNumber,
            matchIndex + word.length + 1
          ),
        });
      }
    }
    return references;
  },
};

export default ReferenceProvider;