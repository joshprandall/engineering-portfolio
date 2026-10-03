param(
  [Parameter(Mandatory=$true)][string]$SourceRoot,
  [Parameter(Mandatory=$true)][string]$PublicRoot,
  [Parameter(Mandatory=$true)][string]$ManifestPath
)
$ErrorActionPreference='Stop'
$manifest=Get-Content -Raw -LiteralPath $ManifestPath | ConvertFrom-Json
$backup=Join-Path (Split-Path -Parent $PublicRoot) ('website-hotfix-backup-'+[DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss'))
$reference=Get-Acl -LiteralPath (Join-Path $PublicRoot 'site-scenes.js')
$sections=[System.Security.AccessControl.AccessControlSections]::Access
function Set-WebAccess([string]$FilePath) {
  # Apply only access rules. Re-applying owner/group through Set-Acl can fail
  # against Samba; copying a Windows file can import its private local ACL.
  $access=New-Object System.Security.AccessControl.FileSecurity
  $access.SetSecurityDescriptorSddlForm($reference.GetSecurityDescriptorSddlForm($sections),$sections)
  [System.IO.File]::SetAccessControl($FilePath,$access)
}
foreach ($entry in $manifest.files) {
  if ($entry.path -notmatch '^[A-Za-z0-9-]+\.(html|js|css)$') { throw 'Only declared root web files may be changed' }
  $source=Join-Path $SourceRoot $entry.path
  $target=Join-Path $PublicRoot $entry.path
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $source).Hash -ine $entry.sha256) { throw ('Unverified source: '+$entry.path) }
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash -ine $entry.previousSha256) { throw ('Live file changed since review: '+$entry.path) }
}
[System.IO.Directory]::CreateDirectory($backup) | Out-Null
foreach ($entry in $manifest.files) {
  [System.IO.File]::WriteAllBytes((Join-Path $backup $entry.path),[System.IO.File]::ReadAllBytes((Join-Path $PublicRoot $entry.path)))
}
try {
  foreach ($entry in $manifest.files) {
    $target=Join-Path $PublicRoot $entry.path
    $temporary=$target+'.repair-'+[Guid]::NewGuid().ToString('N')+'.tmp'
    try {
      [System.IO.File]::WriteAllBytes($temporary,[System.IO.File]::ReadAllBytes((Join-Path $SourceRoot $entry.path)))
      Set-WebAccess $temporary
      if ((Get-FileHash -Algorithm SHA256 -LiteralPath $temporary).Hash -ine $entry.sha256) { throw ('Staged checksum failed: '+$entry.path) }
      if ((Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash -ine $entry.previousSha256) { throw ('Live file changed during publishing: '+$entry.path) }
      # OSU permits writing existing files but does not grant SMB delete/rename
      # rights. Write verified bytes into the existing file to retain its owner
      # and access rules; the complete backup below supports rollback.
      [System.IO.File]::WriteAllBytes($target,[System.IO.File]::ReadAllBytes($temporary))
      Set-WebAccess $target
      if ((Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash -ine $entry.sha256) { throw ('Published checksum failed: '+$entry.path) }
      if (-not ((Get-Acl -LiteralPath $target).Access | Where-Object { $_.IdentityReference.Value -eq 'Everyone' -and $_.AccessControlType -eq 'Allow' -and ($_.FileSystemRights -band [System.Security.AccessControl.FileSystemRights]::ReadData) })) { throw ('Missing public-read permission: '+$entry.path) }
    } finally {
      if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary }
    }
  }
  Add-Type -AssemblyName System.Net.Http
  $client=New-Object System.Net.Http.HttpClient
  try {
    foreach ($entry in $manifest.files) {
      $uri=$manifest.publicUrl.TrimEnd('/')+'/'+$entry.path+'?v='+$manifest.version
      $bytes=$client.GetByteArrayAsync($uri).GetAwaiter().GetResult()
      $sha=[System.Security.Cryptography.SHA256]::Create()
      try { $actual=([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-','') } finally { $sha.Dispose() }
      if ($actual -ine $entry.sha256) { throw ('Public checksum failed: '+$entry.path) }
    }
  } finally { $client.Dispose() }
} catch {
  foreach ($entry in $manifest.files) {
    $target=Join-Path $PublicRoot $entry.path
    [System.IO.File]::WriteAllBytes($target,[System.IO.File]::ReadAllBytes((Join-Path $backup $entry.path)))
    Set-WebAccess $target
  }
  throw
}
Write-Output ('Published and publicly verified '+$manifest.files.Count+' web files. Rollback: '+$backup)
