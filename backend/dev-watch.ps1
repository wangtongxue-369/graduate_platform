param(
  [int]$Port = 0
)

$ErrorActionPreference = 'Stop'

$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$javaDir = Join-Path $backendDir 'src\main\java'
$resourcesDir = Join-Path $backendDir 'src\main\resources'
$roots = @($javaDir, $resourcesDir)

function Invoke-Compile {
  Write-Host "[backend-dev] compiling changed sources..."
  Push-Location $backendDir
  try {
    & mvn.cmd -q -DskipTests compile
    if ($LASTEXITCODE -ne 0) {
      throw "mvn compile failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

Push-Location $backendDir
try {
  $runArgs = @('spring-boot:run', '-Dspring-boot.run.profiles=dev')
  if ($Port -gt 0) {
    $runArgs += "-Dspring-boot.run.arguments=--server.port=$Port"
  }
  $runProcess = Start-Process -FilePath 'mvn.cmd' -ArgumentList $runArgs -PassThru -NoNewWindow

  $watchers = @()
  foreach ($root in $roots) {
    if (-not (Test-Path $root)) {
      continue
    }

    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $root
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true
    $watcher.NotifyFilter = [System.IO.NotifyFilters]'FileName, LastWrite, CreationTime, Size'
    $watcher.Filter = '*.*'
    $watchers += $watcher
  }

  if ($watchers.Count -eq 0) {
    throw 'No watch roots found under src/main/java or src/main/resources'
  }

  $queue = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()
  $subscriptions = @()

  foreach ($watcher in $watchers) {
    foreach ($eventName in @('Changed', 'Created', 'Renamed', 'Deleted')) {
      $subscriptions += Register-ObjectEvent -InputObject $watcher -EventName $eventName -Action {
        $path = if ($Event.SourceEventArgs.FullPath) { $Event.SourceEventArgs.FullPath } else { '' }
        if (-not $path) { return }
        if ($path -match '\\target\\') { return }
        if ($path -match '~$') { return }
        if ($path -notmatch '\\src\\main\\(java|resources)\\') { return }
        $queue.Enqueue($path) | Out-Null
      }
    }
  }

  Write-Host "[backend-dev] watching backend sources..."
  Write-Host "[backend-dev] spring-boot run pid: $($runProcess.Id)"
  Write-Host "[backend-dev] edit .java/.yml/.properties files under src/main and devtools will restart after compile"

  $lastCompileAt = [datetime]::MinValue

  while (-not $runProcess.HasExited) {
    Start-Sleep -Milliseconds 400

    if ($queue.IsEmpty) {
      continue
    }

    if ((Get-Date) - $lastCompileAt -lt [TimeSpan]::FromSeconds(1)) {
      continue
    }

    $discarded = $null
    while ($queue.TryDequeue([ref]$discarded)) {
    }

    Invoke-Compile
    $lastCompileAt = Get-Date
  }

  Write-Host "[backend-dev] spring-boot run exited with code $($runProcess.ExitCode)"
  exit $runProcess.ExitCode
} finally {
  Get-Variable subscriptions -ErrorAction SilentlyContinue | ForEach-Object {
    foreach ($subscription in $_.Value) {
      try {
        Unregister-Event -SubscriptionId $subscription.Id -ErrorAction SilentlyContinue
      } catch {
      }
    }
  }
  Get-Variable watchers -ErrorAction SilentlyContinue | ForEach-Object {
    foreach ($watcher in $_.Value) {
      try {
        $watcher.EnableRaisingEvents = $false
        $watcher.Dispose()
      } catch {
      }
    }
  }
  Pop-Location
}
