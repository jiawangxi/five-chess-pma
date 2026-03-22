#!/bin/bash

# Encoding check and fix script
# Usage: ./scripts/check-encoding.sh [--fix]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔍 Checking project file encodings..."

cd "$PROJECT_DIR"

# Find all source files including MD documents
FILES=$(find ./src -name '*.vue' -o -name '*.ts' -o -name '*.js' -o -name '*.html' -o -name '*.css'; find . -name '*.md' -not -path './node_modules/*' -not -path './dist/*')

TOTAL=0
UTF8_COUNT=0
NON_UTF8_COUNT=0
NON_UTF8_FILES=()

for FILE in $FILES; do
    if [ -f "$FILE" ]; then
        TOTAL=$((TOTAL + 1))
        ENCODING=$(file --mime-encoding "$FILE" | cut -d: -f2 | tr -d ' ')
        
        case "$ENCODING" in
            "utf-8"|"us-ascii")
                UTF8_COUNT=$((UTF8_COUNT + 1))
                echo "✅ $FILE: $ENCODING"
                ;;
            *)
                NON_UTF8_COUNT=$((NON_UTF8_COUNT + 1))
                NON_UTF8_FILES+=("$FILE")
                echo "❌ $FILE: $ENCODING"
                ;;
        esac
    fi
done

echo ""
echo "📊 Encoding check results:"
echo "   Total files: $TOTAL"
echo "   UTF-8 files: $UTF8_COUNT"
echo "   Non-UTF-8 files: $NON_UTF8_COUNT"

if [ $NON_UTF8_COUNT -gt 0 ]; then
    echo ""
    echo "⚠️  Found $NON_UTF8_COUNT non-UTF-8 encoded files:"
    for FILE in "${NON_UTF8_FILES[@]}"; do
        echo "   - $FILE"
    done
    
    if [ "$1" == "--fix" ]; then
        echo ""
        echo "🔧 Fixing encoding issues..."
        for FILE in "${NON_UTF8_FILES[@]}"; do
            echo "Fixing: $FILE"
            iconv -f gbk -t utf-8 "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
        done
        echo "✅ Encoding fix completed!"
    else
        echo ""
        echo "💡 Run './scripts/check-encoding.sh --fix' to auto-fix"
    fi
    
    exit 1
else
    echo "✅ All files have correct encoding!"
    exit 0
fi