$Python = "C:\Users\dhara\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if (!(Test-Path $Python)) {
  $Python = "python"
}
& $Python "$PSScriptRoot\backend\server.py"
