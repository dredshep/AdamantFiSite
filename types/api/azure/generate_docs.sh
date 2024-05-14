#!/bin/bash

# Output file
output_file="documentation.md"

# Create or clear the output file
: > "$output_file"

# Function to process each file
process_file() {
  local file="$1"
  local relative_path="${file#./}"

  # Add file header
  echo '```ts' >> "$output_file"
  echo "// $relative_path" >> "$output_file"

  # Add file content
  echo '' >> "$output_file"
  cat "$file" >> "$output_file"
  echo '```' >> "$output_file"
  echo "" >> "$output_file"
}

# Find all .ts files and process them
find . -name "*.ts" | while read -r file; do
  process_file "$file"
done

echo "Documentation generated in $output_file"
