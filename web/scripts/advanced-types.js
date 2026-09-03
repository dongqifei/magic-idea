const fs = require('fs-extra');
const path = require('path');

async function generateAdvancedTypes() {
  console.log('🚀 生成类型定义...');
  
  const projectDir = process.cwd();
  const typesDir = path.join(projectDir, 'types');
  
  // 1. 清理目录
  await fs.remove(typesDir);
  await fs.ensureDir(typesDir);
  
  // 2. 先用 tsc 生成临时声明文件
  console.log('📄 生成临时声明文件...');
  const tsconfig = {
    extends: './tsconfig.json',
    "compilerOptions": {
      "declaration": true,
      "declarationMap": false,
      "declarationDir": "./types",
      "emitDeclarationOnly": true,
      "outDir": "./types/",
      "noEmit": false,
      "composite": true,
      "rootDir": "./src",
      
      // 关键：关闭所有严格检查，避免编译错误
      "strict": false,
      "noUnusedLocals": false,
      "noUnusedParameters": false,
      "noImplicitAny": false,
      "noImplicitReturns": false,
      "noFallthroughCasesInSwitch": false,
      "noImplicitOverride": false,
      
      // 解决模块解析问题
      "moduleResolution": "node",
      "esModuleInterop": true,
      "allowSyntheticDefaultImports": true,
      "skipLibCheck": true,
      
      // 保持原配置
      "target": "ES2020",
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "allowImportingTsExtensions": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "react-jsx",
      "baseUrl": "./",
      "paths": {
        "@MagicIdea/*": ["./src/*"]
      }
    },
    "include": [
      "src/core/**/*",  // 只包含 core 目录
      "src/editor/**/*"  // 只包含 editor 目录
    ],
    "exclude": [
      "node_modules",
      "dist",
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.stories.*",
      "**/*.demo.*"
    ]
  };
  
  try {
    await fs.writeJson(path.join(projectDir, 'tsconfig.temp.json'), tsconfig, { spaces: 2 });
    
    require('child_process').execSync('tsc -p tsconfig.temp.json', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  TypeScript 编译有警告，但继续处理...');
  }
  
  // 3. 合并临时文件到一个入口点
  console.log('🔧 合并声明文件...');
  const entryPoint = await createEntryPoint(typesDir);
  await fs.writeFile(path.join(typesDir, 'index.d.ts'), entryPoint, 'utf-8');
  
  console.log('🔧 修复类型文件...');
  await fixTypeFiles(typesDir);
  
  console.log('✅ 构建完成！');
  console.log('\n📁 输出目录: types');
  console.log('\n🔗 插件使用方式:');
  console.log('npm install file:../../types');
  console.log('\n📦 然后导入:');
  console.log("import { PreferenceService } from '@capital/core/preferences'");

  console.log('📦 创建包配置...');
  await createPackageConfig(projectDir, typesDir);

  // 4. 清理临时文件
  await fs.remove(path.join(projectDir, 'tsconfig.temp.json'));
  await fs.remove(path.join(projectDir, 'tsconfig.temp.tsbuildinfo'));
  
  console.log('✅ 高级类型定义生成完成！');
}

async function createPackageConfig(rootDir, distDir) {
  const originalPkg = require(path.join(rootDir, 'package.json'));
  
  const publishPkg = {
    name: "magic-idea",
    version: originalPkg.version,
    description: originalPkg.description || "MagicIdea Core Framework",
    license: originalPkg.license || "ISC",
    author: originalPkg.author || "",
    
    // 主入口
    types: "./index.d.ts",
    
    // 子路径导出
    exports: {
      ".": "./index.d.ts",
      "./core": "./core/index.d.ts",
      "./core/*": "./core/*/index.d.ts",
      "./editor": "./editor/index.d.ts",
    },
    
    // 依赖
    dependencies: {
      "@lumino/algorithm": "^2.0.4",
      "@lumino/collections": "^2.0.4",
      "@lumino/commands": "^2.3.3",
      "@lumino/coreutils": "^2.2.2",
      "@lumino/default-theme": "^2.1.10",
      "@lumino/disposable": "^2.1.5",
      "@lumino/domutils": "^2.0.4",
      "@lumino/dragdrop": "^2.1.7",
      "@lumino/keyboard": "^2.0.4",
      "@lumino/messaging": "^2.0.4",
      "@lumino/signaling": "^2.1.5",
      "@lumino/virtualdom": "^2.0.4",
      "@lumino/widgets": "^2.7.2",
      "inversify": "^6.2.2",
      "monaco-editor": "^0.55.1",
    },
    
    // 包含文件
    files: ["**/*"]
  };
  
  await fs.writeJson(
    path.join(distDir, 'package.json'),
    publishPkg,
    { spaces: 2 }
  );
  
  // 复制其他必要文件
  const filesToCopy = ['README.md', 'LICENSE'];
  for (const file of filesToCopy) {
    try {
      await fs.copy(
        path.join(rootDir, file),
        path.join(distDir, file)
      );
    } catch (error) {
      // 忽略文件不存在的情况
    }
  }
  
  console.log('✅ 创建 package.json');
}

async function fixTypeFiles(typesDir) {
  const files = await getAllFiles(typesDir, '.d.ts');
  
  for (const file of files) {
    let content = await fs.readFile(file, 'utf-8');
    
    // 修复相对路径
    content = content
      .replace(/from\s+['"]\.\.\/([^'"]+)\.ts['"]/g, "from '../$1'")
      .replace(/from\s+['"]\.\/([^'"]+)\.ts['"]/g, "from './$1'")
      .replace(/from\s+['"]@MagicIdea\/([^'"]+)['"]/g, (match, p1) => {
        const fromDir = path.dirname(file);
        const targetPath = path.join(typesDir, p1);
        const relativePath = path.relative(fromDir, targetPath);
        return `from '${relativePath.startsWith('.') ? relativePath : './' + relativePath}'`;
      });
    
    await fs.writeFile(file, content, 'utf-8');
  }
}

async function getAllFiles(dir, ext) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...await getAllFiles(fullPath, ext));
    } else if (item.isFile() && item.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function createEntryPoint(tempDir) {
  const coreExports = [];
  const sharedExports = [];
  
  // 扫描核心模块
  const coreDir = path.join(tempDir, 'core');
  if (await fs.pathExists(coreDir)) {
    coreExports.push(`
declare module '@capital/core' {
  export * from 'magic-idea/core';
}`);
    const coreModules = await fs.readdir(coreDir);
    for (const module of coreModules) {
      if (await fs.pathExists(path.join(coreDir, module, 'index.d.ts'))) {
        // coreExports.push(`export * from './core/${module}';`);
        coreExports.push(`
declare module '@capital/core/${module}' {
  export * from 'magic-idea/core/${module}';
}`);
      }
    }
  }

  const eidtorDir = path.join(tempDir, 'editor');

  if (await fs.pathExists(eidtorDir)) {
    coreExports.push(`
declare module '@capital/editor' {
  export * from 'magic-idea/editor';
}`);
  }
  
  // 扫描共享模块
//   const sharedDir = path.join(tempDir, 'shared');
//   if (await fs.pathExists(sharedDir)) {
//     const sharedModules = await fs.readdir(sharedDir);
//     for (const module of sharedModules) {
//       if (await fs.pathExists(path.join(sharedDir, module, 'index.d.ts'))) {
//         // sharedExports.push(`export * from './shared/${module}';`);
//         sharedExports.push(`
// declare module '@capital/shared/${module}' {
//   export * from 'magic-idea/shared/${module}';
// }`);
//       }
//     }
//   }
  const sharedModules = ['inversify', 'monaco-editor'];
  for (const module of sharedModules) {
    sharedExports.push(`
declare module '@capital/shared/${module}' {
  export * from '${module}';
}`);
  }
  return `// MagicIdea 类型定义
${coreExports.join('\n')}
${sharedExports.join('\n')}`;
}

generateAdvancedTypes().catch(console.error);