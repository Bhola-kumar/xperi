#!/bin/bash

# Function to increment version
increment_version() {
    local version=$1
    local release_type=$2

    IFS='.' read -ra version_parts <<< "$version"
    major=${version_parts[0]}
    minor=${version_parts[1]}
    patch=${version_parts[2]}

    case $release_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            echo "Invalid release type. Use 'major', 'minor', or 'patch'."
            exit 1
            ;;
    esac

    echo "${major}.${minor}.${patch}"
}

# Get the current version from the latest tag, stripping the 'v' if it exists
current_version=$(git describe --tags --abbrev=0 2>/dev/null | sed 's/^v//') || echo "0.0.0"

# Ask for the release type
echo "Current version: $current_version"
echo "Enter release type (major/minor/patch):"
read release_type

# Calculate the new version
new_version=$(increment_version "$current_version" "$release_type")
echo "New version: $new_version"

# Create a new tag
git tag -a "v$new_version" -m "Release version $new_version"

# Update version in your project files (example: version.txt)
echo "$new_version" > src/devops/scripts/.version

# Commit the changes
git add .version
git commit -m "Bump version to $new_version"

# Push changes and tags to GitLab
git push origin main
git push origin "v$new_version"

echo "Version updated to $new_version and pushed to GitLab"