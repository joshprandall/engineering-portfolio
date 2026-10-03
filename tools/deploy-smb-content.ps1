param(
  [Parameter(Mandatory=$true)][string]$SourceRoot,
  [Parameter(Mandatory=$true)][string]$PublicRoot,
  [Parameter(Mandatory=$true)][string]$ManifestPath
)
$ErrorActionPreference='Stop'
$manifest=Get-Content -Raw -LiteralPath $ManifestPath | ConvertFrom-Json
if ($manifest.publicUrl -cne 'https://web.engr.oregonstate.edu/~randjosh/' -or
    $manifest.version -notmatch '^[A-Za-z0-9-]+$' -or
    @($manifest.files).Count -eq 0) { throw 'Invalid release manifest' }
$reference=Get-Acl -LiteralPath (Join-Path $PublicRoot 'site-scenes.js')
$directoryReference=Get-Acl -LiteralPath (Join-Path $PublicRoot 'assets/audio')
$sections=[System.Security.AccessControl.AccessControlSections]::Access
$backup=Join-Path (Split-Path -Parent $PublicRoot) ('website-content-backup-'+[DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss'))
$contentDir=Join-Path $PublicRoot 'assets/content'
$madeDirectory=$false
$created=New-Object System.Collections.Generic.List[string]
$updated=New-Object System.Collections.Generic.List[string]

function Set-PublicFile([string]$FilePath) {
  $access=New-Object System.Security.AccessControl.FileSecurity
  $access.SetSecurityDescriptorSddlForm($reference.GetSecurityDescriptorSddlForm($sections),$sections)
  [System.IO.File]::SetAccessControl($FilePath,$access)
}
function Set-PublicDirectory([string]$DirectoryPath) {
  $access=New-Object System.Security.AccessControl.DirectorySecurity
  $access.SetSecurityDescriptorSddlForm($directoryReference.GetSecurityDescriptorSddlForm($sections),$sections)
  [System.IO.Directory]::SetAccessControl($DirectoryPath,$access)
}
function Assert-PublicRead([string]$FilePath) {
  if (-not ((Get-Acl -LiteralPath $FilePath).Access | Where-Object {
    $_.IdentityReference.Value -eq 'Everyone' -and $_.AccessControlType -eq 'Allow' -and
    ($_.FileSystemRights -band [System.Security.AccessControl.FileSystemRights]::ReadData)
  })) { throw ('Missing public-read permission: '+$FilePath) }
}

# Preflight every reviewed source and old live byte before creating anything.
$seen=[System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($entry in $manifest.files) {
  $allowed=$entry.path -cmatch '^[a-z0-9-]+\.html$' -or
           $entry.path -ceq 'security-research.js' -or
           $entry.path -cmatch '^assets/content/[a-z0-9-]+\.(svg|mp4|vtt)$'
  if (-not $allowed -or -not $seen.Add([string]$entry.path)) { throw ('Unapproved path: '+$entry.path) }
  if ($entry.sha256 -notmatch '^[A-Fa-f0-9]{64}$') { throw ('Invalid checksum: '+$entry.path) }
  $source=Join-Path $SourceRoot $entry.path
  $target=Join-Path $PublicRoot $entry.path
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $source).Hash -ine $entry.sha256) { throw ('Source changed: '+$entry.path) }
  if ($null -eq $entry.previousSha256) {
    if (Test-Path -LiteralPath $target) { throw ('New path already exists: '+$entry.path) }
  } elseif ($entry.previousSha256 -notmatch '^[A-Fa-f0-9]{64}$' -or
            (Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash -ine $entry.previousSha256) {
    throw ('Live path changed: '+$entry.path)
  }
}

# Stage and checksum every source on the server before touching public_html.
[System.IO.Directory]::CreateDirectory($backup) | Out-Null
foreach ($entry in $manifest.files) {
  $staged=Join-Path $backup ('staged/'+$entry.path)
  [System.IO.Directory]::CreateDirectory((Split-Path -Parent $staged)) | Out-Null
  [System.IO.File]::WriteAllBytes($staged,[System.IO.File]::ReadAllBytes((Join-Path $SourceRoot $entry.path)))
  Set-PublicFile $staged
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $staged).Hash -ine $entry.sha256) { throw ('Staging checksum failed: '+$entry.path) }
  if ($null -ne $entry.previousSha256) {
    $saved=Join-Path $backup ('original/'+$entry.path)
    [System.IO.Directory]::CreateDirectory((Split-Path -Parent $saved)) | Out-Null
    [System.IO.File]::WriteAllBytes($saved,[System.IO.File]::ReadAllBytes((Join-Path $PublicRoot $entry.path)))
  }
}

try {
  if (-not (Test-Path -LiteralPath $contentDir)) {
    [System.IO.Directory]::CreateDirectory($contentDir) | Out-Null
    $madeDirectory=$true
    Set-PublicDirectory $contentDir
  }
  if (-not ((Get-Acl -LiteralPath $contentDir).Access | Where-Object {
    $_.IdentityReference.Value -eq 'Everyone' -and $_.AccessControlType -eq 'Allow' -and
    (($_.FileSystemRights -band [System.Security.AccessControl.FileSystemRights]::ReadAndExecute) -eq [System.Security.AccessControl.FileSystemRights]::ReadAndExecute)
  })) { throw 'Content directory is not publicly traversable' }

  # Make all visual/video support files visible before referencing them in HTML.
  $ordered=$manifest.files | Sort-Object @{Expression={if ($_.path -like '*.html') { 1 } else { 0 }}},path
  foreach ($entry in $ordered) {
    $target=Join-Path $PublicRoot $entry.path
    if ($null -eq $entry.previousSha256) {
      if (Test-Path -LiteralPath $target) { throw ('New path appeared: '+$entry.path) }
    } elseif ((Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash -ine $entry.previousSha256) {
      throw ('Live path changed during release: '+$entry.path)
    }
    if ($null -eq $entry.previousSha256) { $created.Add($entry.path) } else { $updated.Add($entry.path) }
    [System.IO.File]::WriteAllBytes($target,[System.IO.File]::ReadAllBytes((Join-Path $backup ('staged/'+$entry.path))))
    Set-PublicFile $target
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash -ine $entry.sha256) { throw ('Published checksum failed: '+$entry.path) }
    Assert-PublicRead $target
  }

  Add-Type -AssemblyName System.Net.Http
  $client=New-Object System.Net.Http.HttpClient
  try {
    foreach ($entry in $manifest.files) {
      $uri=$manifest.publicUrl+$entry.path+'?v='+$manifest.version
      $response=$client.GetAsync($uri).GetAwaiter().GetResult()
      try {
        $response.EnsureSuccessStatusCode() | Out-Null
        $type=[string]$response.Content.Headers.ContentType.MediaType
        if ($entry.path -like '*.vtt' -and $type -ne 'text/vtt') { throw ('Caption MIME failed: '+$entry.path+' '+$type) }
        if ($entry.path -like '*.mp4' -and $type -ne 'video/mp4') { throw ('Video MIME failed: '+$entry.path+' '+$type) }
        $bytes=$response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
        $hash=[System.Security.Cryptography.SHA256]::Create()
        try { $actual=([BitConverter]::ToString($hash.ComputeHash($bytes))).Replace('-','') } finally { $hash.Dispose() }
        if ($actual -ine $entry.sha256) { throw ('Public checksum failed: '+$entry.path) }
      } finally { $response.Dispose() }
    }
    foreach ($entry in $manifest.files | Where-Object { $_.path -like '*.mp4' }) {
      $request=New-Object System.Net.Http.HttpRequestMessage
      $request.Method=[System.Net.Http.HttpMethod]::Get
      $request.RequestUri=[Uri]($manifest.publicUrl+$entry.path+'?v='+$manifest.version)
      $request.Headers.Range=[System.Net.Http.Headers.RangeHeaderValue]::new(0,1023)
      $response=$client.SendAsync($request).GetAwaiter().GetResult()
      try {
        if ([int]$response.StatusCode -ne 206 -or $response.Content.Headers.ContentRange.From -ne 0 -or
            $response.Content.Headers.ContentRange.To -ne 1023) { throw ('Video byte range failed: '+$entry.path) }
      } finally { $response.Dispose();$request.Dispose() }
    }
  } finally { $client.Dispose() }
} catch {
  $failure=$_
  $rollbackProblems=New-Object System.Collections.Generic.List[string]
  foreach ($path in $updated) {
    try {
      $target=Join-Path $PublicRoot $path
      [System.IO.File]::WriteAllBytes($target,[System.IO.File]::ReadAllBytes((Join-Path $backup ('original/'+$path))))
      Set-PublicFile $target
    } catch { $rollbackProblems.Add(('Restore '+$path+': '+$_)) }
  }
  foreach ($path in $created) {
    try { Remove-Item -LiteralPath (Join-Path $PublicRoot $path) -Force }
    catch { $rollbackProblems.Add(('Remove '+$path+': '+$_)) }
  }
  if ($madeDirectory) {
    try { Remove-Item -LiteralPath $contentDir -Force }
    catch { $rollbackProblems.Add(('Remove content directory: '+$_)) }
  }
  if ($rollbackProblems.Count) { throw ('Rollback incomplete; backup '+$backup+'; original error '+$failure+'; problems '+($rollbackProblems -join '; ')) }
  throw ('Release failed and rollback restored previous files: '+$failure)
}
Write-Output ('Published and publicly verified '+$manifest.files.Count+' files. Rollback: '+$backup)
