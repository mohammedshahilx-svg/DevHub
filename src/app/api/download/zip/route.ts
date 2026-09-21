import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ZipArchive } from 'archiver';
import { PassThrough } from 'stream';
import { getDb, saveDb, verifyAuthToken } from '@/lib/storage';
import { SoftwareItem } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { toolIds, packName } = await request.json();

    if (!Array.isArray(toolIds) || toolIds.length === 0) {
      return NextResponse.json({ error: 'Please select at least one software to download.' }, { status: 400 });
    }

    const db = getDb();
    const selectedTools: SoftwareItem[] = db.software.filter(s => toolIds.includes(s.id));

    if (selectedTools.length === 0) {
      return NextResponse.json({ error: 'None of the selected tools were found.' }, { status: 404 });
    }

    // Record in user history if authenticated
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('devhub_token')?.value;
      if (token) {
        const payload = verifyAuthToken(token);
        if (payload) {
          const user = db.users.find(u => u.id === payload.userId);
          if (user) {
            user.downloadHistory.unshift({
              id: `dl-${Date.now()}`,
              softwareNames: selectedTools.map(t => t.name),
              toolIds: selectedTools.map(t => t.id),
              date: new Date().toISOString(),
              format: 'zip',
            });
            user.downloadHistory = user.downloadHistory.slice(0, 30);
            saveDb(db);
          }
        }
      }
    } catch (authErr) {
      console.warn('Could not record user download history:', authErr);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const archiveTitle = packName ? packName.trim() : 'DevHub Custom Software Pack';

    // 1. install-manifest.json
    const manifestContent = JSON.stringify({
      packageTitle: archiveTitle,
      createdAt: new Date().toISOString(),
      itemCount: selectedTools.length,
      software: selectedTools.map(t => ({
        id: t.id,
        name: t.name,
        version: t.version,
        category: t.category,
        license: t.license,
        sizeEstimate: t.sizeEstimate,
        wingetId: t.wingetId || null,
        officialWebsite: t.website,
        downloadUrl: t.downloadUrl,
      })),
    }, null, 2);

    // 2. 1-Click-Download-All-Installers.bat
    const oneClickBat = [
      '@echo off',
      'title DevHub - Download All Installers',
      'color 0B',
      'echo ========================================================',
      `echo    ${archiveTitle}`,
      `echo    Selected Tools (${selectedTools.length}): ${selectedTools.map(t => t.name).join(', ')}`,
      'echo ========================================================',
      'echo.',
      'echo Starting 1-Click download of all installer files into "Installers" folder...',
      'echo.',
      'powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0download-all-installers.ps1"',
      'pause',
    ].join('\r\n');

    // 3. download-all-installers.ps1 (PowerShell script that downloads all setup files)
    const downloadScriptLines = [
      '# DevHub Automated Downloader',
      `# Package: ${archiveTitle}`,
      'Write-Host "========================================================" -ForegroundColor Cyan',
      `Write-Host "   Downloading ${selectedTools.length} Software Installers" -ForegroundColor Yellow`,
      'Write-Host "========================================================" -ForegroundColor Cyan',
      'Write-Host ""',
      '$destDir = Join-Path $PSScriptRoot "Installers"',
      'if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }',
      'Write-Host "Destination folder: $destDir" -ForegroundColor Gray',
      'Write-Host ""',
    ];

    selectedTools.forEach((t, idx) => {
      const ext = t.downloadUrl.endsWith('.msi') ? 'msi' : t.downloadUrl.endsWith('.zip') ? 'zip' : 'exe';
      const cleanFileName = `${t.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_v${t.version}.${ext}`;
      downloadScriptLines.push(`Write-Host "[${idx + 1}/${selectedTools.length}] Downloading ${t.name} (Estimated: ${t.sizeEstimate})..." -ForegroundColor Green`);
      downloadScriptLines.push(`$outFile = Join-Path $destDir "${cleanFileName}"`);
      downloadScriptLines.push(`try {`);
      downloadScriptLines.push(`    $webClient = New-Object System.Net.WebClient`);
      downloadScriptLines.push(`    $webClient.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")`);
      downloadScriptLines.push(`    $webClient.DownloadFile("${t.downloadUrl}", $outFile)`);
      downloadScriptLines.push(`    Write-Host "  ✓ Saved: $outFile" -ForegroundColor Green`);
      downloadScriptLines.push(`} catch {`);
      downloadScriptLines.push(`    Write-Host "  ✗ Direct download link encountered an issue. Using fallback browser open..." -ForegroundColor Red`);
      downloadScriptLines.push(`    Start-Process "${t.downloadUrl}"`);
      downloadScriptLines.push(`}`);
      downloadScriptLines.push('Write-Host ""');
    });

    downloadScriptLines.push('Write-Host "========================================================" -ForegroundColor Cyan');
    downloadScriptLines.push('Write-Host " All downloads complete! Check the Installers/ folder." -ForegroundColor Green');
    downloadScriptLines.push('Write-Host "========================================================" -ForegroundColor Cyan');
    downloadScriptLines.push('$response = Read-Host "Would you like to open the Installers folder now? (Y/N)"');
    downloadScriptLines.push('if ($response -eq "Y" -or $response -eq "y") { Invoke-Item $destDir }');
    const downloadScriptContent = downloadScriptLines.join('\r\n');

    // 4. install-all.bat (Interactive Windows Command Prompt script for Winget silent install)
    const batLines = [
      '@echo off',
      'title DevHub Automated Installer',
      'color 0A',
      'echo ========================================================',
      `echo    ${archiveTitle}`,
      `echo    Tools to install: ${selectedTools.map(t => t.name).join(', ')}`,
      'echo ========================================================',
      'echo.',
      'echo Installing software packages via Windows Package Manager...',
      'echo.',
    ];

    selectedTools.forEach(t => {
      if (t.wingetId) {
        batLines.push(`echo [*] Installing ${t.name}...`);
        batLines.push(`winget install --id "${t.wingetId}" --exact --accept-package-agreements --accept-source-agreements`);
        batLines.push('echo.');
      } else {
        batLines.push(`echo [*] Opening download for ${t.name}...`);
        batLines.push(`start "" "${t.downloadUrl}"`);
        batLines.push('echo.');
      }
    });

    batLines.push('echo ========================================================');
    batLines.push('echo   Process complete! Check README-GETTING-STARTED.md.');
    batLines.push('echo ========================================================');
    batLines.push('pause');
    const batContent = batLines.join('\r\n');

    // 5. README-GETTING-STARTED.md
    const mdLines = [
      `# ${archiveTitle}`,
      `Generated on ${new Date().toLocaleDateString()} from DevHub.`,
      '',
      `This ZIP bundle contains installer automation and direct links for **${selectedTools.length} developer tools and compilers**.`,
      '',
      '## Included Software',
      '',
      ...selectedTools.map((t, idx) => [
        `### ${idx + 1}. ${t.name} (v${t.version})`,
        `- **Category:** ${t.category.toUpperCase()}`,
        `- **Description:** ${t.description}`,
        `- **License:** ${t.license}`,
        `- **Size:** ~${t.sizeEstimate}`,
        `- **Official Website:** [${t.website}](${t.website})`,
        `- **Direct Installer Download:** [Click to Download Installer](${t.downloadUrl})`,
        t.wingetId ? `- **Winget Command:** \`winget install --id ${t.wingetId}\`` : '',
        `- **Release Notes:** ${t.releaseNotes}`,
        '',
      ].filter(Boolean).join('\n')),
      '## How to Use This Package',
      '1. **Download All Installers into a folder:** Double-click `1-Click-Download-All-Installers.bat`. It will fetch all setup EXEs/MSIs directly into an `Installers/` subfolder.',
      '2. **Silent Automated Install via Winget:** Right-click `install-all.bat` and run as Administrator.',
      '3. **Offline Visual Dashboard:** Double-click `quick-links.html` to view clean cards with 1-click download buttons in your web browser.',
      '',
      '---',
      '*DevHub - AI & Developer Software Portal*'
    ];
    const readmeContent = mdLines.join('\n');

    // 6. quick-links.html (Offline browser dashboard)
    const htmlCards = selectedTools.map(t => `
      <div class="card">
        <div class="card-header">
          <span class="badge ${t.category}">${t.category}</span>
          <span class="version">v${t.version}</span>
        </div>
        <h3>${t.name}</h3>
        <p class="tagline">${t.tagline}</p>
        <p class="desc">${t.description}</p>
        <div class="meta">Size: ~${t.sizeEstimate} • License: ${t.license}</div>
        <div class="actions">
          <a href="${t.downloadUrl}" target="_blank" class="btn primary">Download Installer</a>
          <a href="${t.website}" target="_blank" class="btn secondary">Website</a>
        </div>
        ${t.wingetId ? `<div class="cli-cmd"><code>winget install --id ${t.wingetId}</code></div>` : ''}
      </div>
    `).join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${archiveTitle} - DevHub Offline Dashboard</title>
  <style>
    :root {
      --bg: #090d13;
      --surface: #121820;
      --border: #232b36;
      --text: #f0f6fc;
      --text-muted: #8b949e;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 40px 20px;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    header { margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 24px; }
    h1 { margin: 0 0 8px 0; font-size: 2rem; color: #fff; }
    p.lead { color: var(--text-muted); margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .badge { text-transform: uppercase; font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; background: #238636; color: #fff; }
    .badge.ai { background: #7c3aed; }
    .badge.compiler { background: #d97706; }
    .badge.runtime { background: #2563eb; }
    .badge.ide { background: #db2777; }
    .badge.tool { background: #059669; }
    .version { color: var(--text-muted); font-size: 0.85rem; font-family: monospace; }
    h3 { margin: 0 0 6px 0; font-size: 1.25rem; font-weight: 800; }
    .tagline { color: #60a5fa; font-size: 0.9rem; margin: 0 0 10px 0; font-weight: 600; }
    .desc { color: var(--text-muted); font-size: 0.85rem; line-height: 1.45; flex-grow: 1; margin-bottom: 16px; }
    .meta { font-size: 0.75rem; color: #64748b; margin-bottom: 14px; }
    .actions { display: flex; gap: 10px; margin-bottom: 12px; }
    .btn { display: inline-block; text-align: center; text-decoration: none; padding: 9px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; flex: 1; }
    .btn.primary { background: var(--primary); color: #fff; }
    .btn.primary:hover { background: var(--primary-hover); }
    .btn.secondary { background: #1e293b; color: var(--text); border: 1px solid var(--border); }
    .cli-cmd { background: #05080c; padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; border: 1px solid #1e293b; }
    code { color: #4ade80; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${archiveTitle}</h1>
      <p class="lead">Selected ${selectedTools.length} developer tools and compilers • Generated by DevHub</p>
    </header>
    <div class="grid">
      ${htmlCards}
    </div>
  </div>
</body>
</html>`;

    // Create zip stream with ZipArchive
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    // Append files to ZIP
    archive.append(oneClickBat, { name: '1-Click-Download-All-Installers.bat' });
    archive.append(downloadScriptContent, { name: 'download-all-installers.ps1' });
    archive.append(batContent, { name: 'install-all.bat' });
    archive.append(manifestContent, { name: 'install-manifest.json' });
    archive.append(readmeContent, { name: 'README-GETTING-STARTED.md' });
    archive.append(htmlContent, { name: 'quick-links.html' });

    // Finalize the archive
    archive.finalize();

    const webStream = new ReadableStream({
      start(controller) {
        passThrough.on('data', chunk => controller.enqueue(chunk));
        passThrough.on('end', () => controller.close());
        passThrough.on('error', err => controller.error(err));
      }
    });

    const fileName = `devhub-pack-${timestamp}.zip`;

    return new Response(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: unknown) {
    console.error('ZIP generation error:', err);
    return NextResponse.json({ error: 'Failed to build ZIP package.' }, { status: 500 });
  }
}
