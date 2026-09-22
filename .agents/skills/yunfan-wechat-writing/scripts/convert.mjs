#!/usr/bin/env node
/**
 * Markdown → 公众号兼容 HTML
 * 原理逆向自 mdnice 编辑器"复制到公众号"：
 * 公众号编辑器剥离 <style> 标签与大部分 class，仅元素内联 style 能存活。
 * 因此核心步骤 = 渲染 HTML + juice 把主题 CSS 全部内联。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const skillDir = dirname(fileURLToPath(import.meta.url));
const input = process.argv[2];
if (!input) { console.error('用法: node convert.mjs 文章.md'); process.exit(1); }
const mdPath = resolve(input);
if (!existsSync(mdPath)) { console.error('文件不存在: ' + mdPath); process.exit(1); }

// 依赖就近装在 skill 的 scripts/node_modules，首次自动安装
try {
  await import('marked'); await import('juice');
} catch {
  console.error('首次运行，安装依赖 marked + juice ...');
  execSync('npm install --prefix "' + skillDir + '" marked juice --no-fund --no-audit', { stdio: 'inherit' });
}
const { marked } = await import('marked');
const juice = (await import('juice')).default;

const css = readFileSync(join(skillDir, 'theme.css'), 'utf-8');
const md = readFileSync(mdPath, 'utf-8');

// 剥掉 front-matter（如有），取正文；title 留给用户在公众号后台填
const body = md.replace(/^---\n[\s\S]*?\n---\n/, '');

let html = marked.parse(body, { breaks: true, gfm: true });

// 表格包一层，加公众号草稿属性（对应 mdnice PD() 中 table-container 处理）
html = html.replace(/<table>/g, '<table data-draft-node="block" data-draft-type="table" data-size="normal">');

const full = `<section id="nice">${html}</section>`;

// 关键：全部样式内联（等效 mdnice MD() 里的 inlineContent）
const out = juice(full, {
  extraCss: css,
  inlinePseudoElements: true,
  preserveImportant: true,
});

const outPath = mdPath.replace(/\.md$/i, '') + '.wechat.html';
writeFileSync(outPath, out, 'utf-8');
console.log('已生成: ' + outPath);
console.log('下一步: python3 ' + join(skillDir, 'clipboard.py') + ' ' + JSON.stringify(outPath));
