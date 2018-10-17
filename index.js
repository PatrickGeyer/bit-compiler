import ts from 'typescript';
import Vinyl from 'vinyl';
import path from 'path';
import groupBy from '@bit/bit.utils.object.group-by';
import fs from 'fs';

const compiledFileTypes = ['tsx', 'ts'];

const compile = (files, distPath) => {
  // Divide files by whether we should compile them, according to file type.
  const filesByToCompile = groupBy(files, _toCompile);

  let p = ts.createProgram({
    rootNames: filesByToCompile.true.map(function (file) {
      return file.path;
    }),
    options: {
      module: ts.ModuleKind.CommonJS,
      sourceMap: false,
      declaration: true,
      outDir: distPath,
      listEmittedFiles: true
    }
  });
  let result = p.emit();

  const compiled = result.emittedFiles.map((path) => {
    return new Vinyl({
      path: path, 
      contents: new Buffer(fs.readFileSync(path)),
      base: distPath,
    })
  });
  const nonCompiled = !filesByToCompile.false ? [] : filesByToCompile.false.map(file => _getDistFile(file, distPath, false));

  return compiled.concat(nonCompiled);;
}

const _toCompile = (file) => {
  return compiledFileTypes.indexOf(file.extname.replace('.', '')) > -1 && !file.stem.endsWith('.d');
}

const _getDistFile = (file, distPath, reviseExtension, content) => {
  let distFile = file.clone();
  distFile.base = distPath;
  distFile.path = _getDistFilePath(file, distPath, reviseExtension);

  if (content) {
    distFile.contents = content;
  }

  return distFile;
}

const _getDistFilePath = (file, distPath, reviseExtension) => {
  var fileRelative = file.relative;

  if (reviseExtension) fileRelative = _getRevisedFileExtension(file.relative);

  return path.join(distPath, fileRelative);
}

const _getRevisedFileExtension = (fileName) => {
  return fileName.replace('.tsx', '.js').replace('.ts', '.js');
}

export default { compile };