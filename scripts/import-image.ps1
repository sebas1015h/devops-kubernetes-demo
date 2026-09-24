$ErrorActionPreference = "Stop"
$raw = wsl -d docker-desktop -- ps
$line = @($raw | Where-Object { $_ -match '/usr/local/bin/containerd$' }) | Select-Object -First 1
if (-not $line) { throw "No se encontro el runtime del cluster" }
$ctrPid = ($line.Trim() -split '\s+')[0]
$image = "ghcr.io/sebas1015h/devops-kubernetes-demo:1.0.0"
$tar = Join-Path $env:TEMP "devops-kubernetes-demo-1.0.0.tar"
docker save $image -o $tar
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
cmd /c "wsl -d docker-desktop -- sh -c `"nsenter -t $ctrPid -m ctr -n k8s.io images import -`" < `"$tar`""
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
