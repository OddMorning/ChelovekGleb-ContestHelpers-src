@echo off

REM Костылик для сохранения папки dist\.git

set "gitDirOrig=dist\.git"
set "gitDirTmp=.dist_git"

powershell -command "move-item -force %gitDirOrig% %gitDirTmp%" & npm run build-prod & powershell -command "move-item -force %gitDirTmp% %gitDirOrig%" & timeout 5
