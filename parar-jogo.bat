@echo off
cd /d "%~dp0"
echo Encerrando servidor do Reino Idle (porta 4173)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Write-Output 'Pronto.'"
timeout /t 2 /nobreak >nul
exit
