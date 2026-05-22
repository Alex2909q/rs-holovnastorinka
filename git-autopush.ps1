$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $projectPath

Write-Host "Git Auto-Push watcher started" -ForegroundColor Green
Write-Host "Watching: $projectPath" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop."
Write-Host ""

$lastCommit = Get-Date

while ($true) {
    Start-Sleep -Seconds 3

    $status = git status --porcelain 2>&1
    if ($status) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] Changes detected - pushing..." -ForegroundColor Yellow

        git add -A
        git commit -m "auto: save at $timestamp"
        git push

        Write-Host "Pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
    }
}
