# Extraheer 3 demo-transcripten uit de Deepgram-JSON-dump naar simplified JSON
# voor de mail-template demo. Run vanaf project-root:
#   powershell -ExecutionPolicy Bypass -File scripts\extract-sample-transcripts.ps1
#
# Bron-dir is hardcoded; pas aan als je structuur verandert.

$ErrorActionPreference = "Stop"

$jsonDir  = "c:\Users\MauritsJonker\& sure-it B.V\N SureIT - Documents\3. Interne Organisatie\AI Ecosystem\40-agents\Renault Dashboard\07 Transcripten\json"
$classCSV = "c:\Users\MauritsJonker\& sure-it B.V\N SureIT - Documents\3. Interne Organisatie\AI Ecosystem\40-agents\Renault Dashboard\07 Transcripten\_classificatie\classificatie_master.csv"
$outDir   = Join-Path $PSScriptRoot "..\src\data\sample-transcripts"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Inbound cases — alle drie eerste-contact telefonie (Ot: "begin met inkomende gesprekken")
$cases = @("2026000022538", "2026000022542", "2026000022536")

$class = Import-Csv -Path $classCSV

# Whisper-naam → echte naam (zie CLAUDE.md). Match op woordgrens in eerste agent-zin.
$whisperMap = [ordered]@{
  "Astrid" = "Arshad Akalie"
  "Arshap" = "Arshad Akalie"
  "Arsha"  = "Arshad Akalie"
  "Sirea"  = "Sayrah Badloe"
  "Sira"   = "Sayrah Badloe"
  "Sija"   = "Sayrah Badloe"
  "Sijde"  = "Sayrah Badloe"
  "Daan"   = "Daniel Buabeng"
  "Daniel" = "Daniel Buabeng"
  "Renno"  = "Reno Els"
  "Renan"  = "Reno Els"
  "Reno"   = "Reno Els"
  "Sarah"  = "Sarah Albuquerque"
  "Sara"   = "Sarah Albuquerque"
}

foreach ($caseId in $cases) {
  $file = Get-ChildItem -Path $jsonDir -Filter "${caseId}_*.json" | Select-Object -First 1
  if (-not $file) {
    Write-Warning "Skip $caseId  geen JSON-bestand gevonden"
    continue
  }

  $j = Get-Content -Path $file.FullName -Raw | ConvertFrom-Json
  $utterances = $j.results.utterances

  # Vereenvoudig: speaker (0=agent vanwege opening) + text + start-time
  $simplified = @(
    $utterances | ForEach-Object {
      [PSCustomObject]@{
        speaker = if ($_.speaker -eq 0) { "agent" } else { "klant" }
        start   = [Math]::Round($_.start, 2)
        text    = $_.transcript
      }
    }
  )

  $clasRow = $class | Where-Object { $_.case_id -eq $caseId } | Select-Object -First 1

  # Herleid agent op basis van eerste agent-utterance
  $firstAgentLine = ($utterances | Where-Object { $_.speaker -eq 0 } | Select-Object -First 1).transcript
  $detectedWhisper = $null
  $realName = "Onbekend"
  foreach ($key in $whisperMap.Keys) {
    if ($firstAgentLine -match "\b$([regex]::Escape($key))\b") {
      $detectedWhisper = $key
      $realName = $whisperMap[$key]
      break
    }
  }

  $output = [PSCustomObject]@{
    case_id          = $caseId
    duration_sec     = $j.metadata.duration
    duration_mmss    = $clasRow.duur_mmss
    merk             = $clasRow.merk
    gesprekstype     = $clasRow.gesprekstype
    hoofdcategorie   = $clasRow.hoofdcategorie
    subonderwerp     = $clasRow.subonderwerp
    eerste_of_herhaal= $clasRow.eerste_of_herhaal
    klant_emotie     = $clasRow.klant_emotie
    opgelost         = $clasRow.opgelost
    terugbel_belofte = $clasRow.terugbel_belofte
    confidence       = $clasRow.confidence
    samenvatting     = $clasRow.samenvatting
    agent_naam       = $realName
    agent_whisper    = $detectedWhisper
    utterances       = $simplified
  }

  $outFile = Join-Path $outDir "${caseId}.json"
  $json = $output | ConvertTo-Json -Depth 6
  # WriteAllText met UTF8Encoding(false) = utf-8 zonder BOM (Set-Content -Encoding utf8 voegt BOM toe in PS 5.1)
  [System.IO.File]::WriteAllText($outFile, $json, (New-Object System.Text.UTF8Encoding($false)))

  Write-Output "wrote $outFile  agent=$realName ($detectedWhisper)  utterances=$($utterances.Count)"
}
