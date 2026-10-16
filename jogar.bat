@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Reino Idle - Iniciador

echo ========================================
echo  Reino Idle - iniciando...
echo ========================================
echo Pasta: %CD%

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado no PATH.
  echo Instale em https://nodejs.org e tente de novo.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRO] npm nao encontrado no PATH.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando dependencias - primeira vez...
  call npm install
  if errorlevel 1 (
    echo [ERRO] npm install falhou. Veja a mensagem acima.
    pause
    exit /b 1
  )
)

echo Atualizando build...
call npm run build
if errorlevel 1 (
  echo [ERRO] npm run build falhou. Veja a mensagem acima.
  pause
  exit /b 1
)

echo Subindo servidor em segundo plano (sem janela)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm','run','preview','--','--port','4173','--strictPort' -WindowStyle Hidden -WorkingDirectory '%CD%'"
if errorlevel 1 (
  echo [AVISO] Falha ao iniciar processo oculto. Tentando modo minimizado...
  start /min cmd /c "npm run preview -- --port 4173 --strictPort"
)

echo Aguardando servidor carregar...
set tentativas=0
:espera
timeout /t 1 /nobreak >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:4173/' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  set /a tentativas+=1
  echo Tentativa !tentativas!/15...
  if !tentativas! GEQ 15 (
    echo Nao consegui confirmar o servidor, vou abrir o navegador mesmo assim...
    goto abrir
  )
  goto espera
)

:abrir
echo Abrindo o jogo no navegador...
start "" "http://localhost:4173/"
if errorlevel 1 (
  echo [ERRO] Nao consegui abrir o navegador. Acesse manualmente: http://localhost:4173/
  pause
  exit /b 1
)
echo Pronto! O iniciador vai fechar. Bom jogo!
timeout /t 2 /nobreak >nul
exit
