function Get-GitIgnorePatterns {
    # Default patterns to always ignore
    $defaultPatterns = @(
        "^\.git",
        "^\.ruff_cache"
    )

    $patterns = $defaultPatterns

    if (Test-Path .gitignore) {
        $gitignorePatterns = Get-Content .gitignore | Where-Object { 
            $_ -and                   # Not empty
            !$_.StartsWith('#') -and  # Not a comment
            $_.Trim()                 # Not whitespace
        } | ForEach-Object {
            # Convert gitignore pattern to regex pattern
            $pattern = $_.Trim()
            $pattern = $pattern.Replace(".", "\.")
            $pattern = $pattern.Replace("*", ".*")
            $pattern = $pattern.Replace("?", ".")
            if (!$pattern.StartsWith("/")) {
                $pattern = ".*$pattern"
            }
            $pattern = $pattern.TrimStart("/")
            "^$pattern"
        }
        $patterns += $gitignorePatterns
    }
    
    return $patterns
}

function Should-Exclude {
    param (
        [string]$Path,
        [array]$IgnorePatterns
    )
    
    foreach ($pattern in $IgnorePatterns) {
        if ($Path -match $pattern) {
            return $true
        }
    }
    return $false
}

function Show-TreeStructure {
    param (
        [string]$Path = ".",
        [string]$Indent = "",
        [array]$IgnorePatterns = @(),
        [System.Text.StringBuilder]$Output
    )

    # Get the current directory name
    $dirName = Split-Path $Path -Leaf
    if ($dirName -eq "") { $dirName = $Path }
    [void]$Output.AppendLine("$Indent$dirName")

    # Get all items in the current directory
    $items = Get-ChildItem -Path $Path -Force

    # Filter out items based on gitignore patterns
    $items = $items | Where-Object {
        $relativePath = $_.FullName.Replace($PWD.Path + "\", "").Replace("\", "/")
        !(Should-Exclude -Path $relativePath -IgnorePatterns $IgnorePatterns)
    }

    # Process directories first
    $directories = $items | Where-Object { $_.PSIsContainer }
    $files = $items | Where-Object { !$_.PSIsContainer }

    # Show directories
    foreach ($dir in $directories) {
        Show-TreeStructure -Path $dir.FullName -Indent "$Indent|   " -IgnorePatterns $IgnorePatterns -Output $Output
    }

    # Show files
    $lastFile = $files | Select-Object -Last 1
    foreach ($file in $files) {
        $fileIndent = if ($file -eq $lastFile) { "$Indent+-- " } else { "$Indent+-- " }
        [void]$Output.AppendLine("$fileIndent$($file.Name)")
    }
}

# Get gitignore patterns
$ignorePatterns = Get-GitIgnorePatterns

# Create StringBuilder to store the output
$output = New-Object System.Text.StringBuilder

# Start the tree structure from the current directory
Show-TreeStructure -Path "." -IgnorePatterns $ignorePatterns -Output $output

# Save the output to project_tree.txt in the project root
$output.ToString() | Out-File -FilePath "project_tree.txt" -Encoding UTF8

# Also display the output in the console
Write-Host $output.ToString()