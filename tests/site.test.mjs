import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dist = join(root, 'dist-wb')
const catalog = JSON.parse(await readFile(join(root, 'catalog/plugins.json'), 'utf8'))
const SITE = 'https://dsh-plugins.app.workbuddy.host/'

// Build if the output directory is missing.
try {
  await stat(join(dist, 'index.html'))
} catch {
  const cmd = process.platform === 'win32' ? 'python' : 'python3'
  const result = spawnSync(cmd, ['scripts/gen_site.py', '--out', 'dist-wb'], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, `gen_site.py 构建失败：${result.stderr}`)
}

const htmlFiles = (await readdir(dist, { recursive: true })).filter((f) => f.endsWith('.html'))

test('双语首页存在且元数据完整', async () => {
  for (const [file, lang] of [['index.html', 'zh-CN'], ['en.html', 'en']]) {
    const html = await readFile(join(dist, file), 'utf8')
    assert.match(html, new RegExp(`<html lang="${lang}"`))
    assert.match(html, /<link rel="canonical" /)
    assert.match(html, /hreflang="zh-CN"/)
    assert.match(html, /hreflang="en"/)
    assert.match(html, /application\/ld\+json/)
    assert.match(html, /深海|Deep Sea|whale|Whale|🐋/)
  }
})

test('每个插件都有中英详情页且内容完整', async () => {
  for (const plugin of catalog.plugins) {
    const [owner, repo] = plugin.repository.split('/').map((x) => encodeURIComponent(x.toLowerCase()))
    for (const prefix of ['plugins', 'en/plugins']) {
      const rel = join(prefix, owner, `${repo}.html`)
      const html = await readFile(join(dist, rel), 'utf8')
      assert.ok(html.includes(plugin.install.command), `详情页缺少安装命令：${rel}`)
      assert.ok(html.includes(`https://github.com/${plugin.repository}`), `详情页缺少上游仓库链接：${rel}`)
      assert.ok(html.includes(SITE), `详情页 canonical 异常：${rel}`)
    }
  }
})

test('llms.txt 带 BOM 且数量正确，llms-full.txt 覆盖全部插件', async () => {
  const buf = await readFile(join(dist, 'llms.txt'))
  assert.deepEqual([...buf.subarray(0, 3)], [0xef, 0xbb, 0xbf], 'llms.txt 缺少 UTF-8 BOM')
  const llms = buf.toString('utf8')
  assert.ok(llms.includes(String(catalog.count)), 'llms.txt 缺少插件总数')
  const full = await readFile(join(dist, 'llms-full.txt'), 'utf8')
  for (const plugin of catalog.plugins.slice(0, 50).concat(catalog.plugins.slice(-5))) {
    assert.ok(full.includes(plugin.repository), `llms-full.txt 缺少插件：${plugin.repository}`)
  }
})

test('sitemap 引用的每个 URL 都有对应文件', async () => {
  const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8')
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  assert.equal(locs.length, catalog.plugins.length * 2 + 6)
  for (const loc of locs) {
    assert.ok(loc.startsWith(SITE), `sitemap URL 域名错误：${loc}`)
    let path = decodeURIComponent(loc.slice(SITE.length))
    if (path === '') path = 'index.html'
    if (path.endsWith('/')) path += 'index.html'
    await readFile(join(dist, path), 'utf8')
  }
})

test('全部 HTML 内部链接都能解析到真实文件', async () => {
  const files = new Set((await readdir(dist, { recursive: true })).map((f) => f.replace(/\\/g, '/')))
  for (const rel of htmlFiles) {
    const html = await readFile(join(dist, rel), 'utf8')
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
    for (const href of hrefs) {
      if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/#')) continue
      if (href.includes("'") || href.includes('+')) continue // 内联 JS 字符串拼接，非真实链接
      const path = decodeURIComponent(href.slice(1).split('#')[0].split('?')[0])
      if (path === '') continue
      assert.ok(files.has(path), `${rel} 内链 404：${href}`)
    }
  }
})

test('中英详情页互为语言切换且目标存在', async () => {
  for (const plugin of catalog.plugins.slice(0, 20)) {
    const [owner, repo] = plugin.repository.split('/').map((x) => encodeURIComponent(x.toLowerCase()))
    const zhHtml = await readFile(join(dist, 'plugins', owner, `${repo}.html`), 'utf8')
    const enHtml = await readFile(join(dist, 'en/plugins', owner, `${repo}.html`), 'utf8')
    assert.match(zhHtml, /hreflang="en"/)
    assert.match(enHtml, /hreflang="zh-CN"/)
    const enHref = zhHtml.match(/class="lang" href="([^"]+)"/)[1]
    const zhHref = enHtml.match(/class="lang" href="([^"]+)"/)[1]
    await readFile(join(dist, enHref.slice(1)), 'utf8')
    await readFile(join(dist, zhHref.slice(1)), 'utf8')
  }
})

test('生成物无第三方聚合站痕迹', async () => {
  for (const rel of ['index.html', 'en.html', 'llms.txt', 'llms-full.txt', 'sitemap.xml', 'feed.xml', 'about.html', 'privacy.html']) {
    const text = await readFile(join(dist, rel), 'utf8')
    assert.doesNotMatch(text, /dsh-plugins\.org|lwmxiaobei/i, `${rel} 含第三方聚合站痕迹`)
  }
  const sample = await readFile(join(dist, 'plugins/zhu1090093659/dsh-web.html'), 'utf8')
  assert.doesNotMatch(sample, /dsh-plugins\.org|lwmxiaobei/i)
})
