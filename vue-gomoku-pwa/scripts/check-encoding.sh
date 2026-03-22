#!/bin/bash

# 编码检查和修复脚本
# 用法: ./scripts/check-encoding.sh [--fix]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "? 检查项目源码文件编码..."

cd "$PROJECT_DIR"

# 查找所有源码文件（包括MD文档）
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
                echo "? $FILE: $ENCODING"
                ;;
            *)
                NON_UTF8_COUNT=$((NON_UTF8_COUNT + 1))
                NON_UTF8_FILES+=("$FILE")
                echo "? $FILE: $ENCODING"
                ;;
        esac
    fi
done

echo ""
echo "? 编码检查结果:"
echo "   总文件数: $TOTAL"
echo "   UTF-8文件: $UTF8_COUNT"
echo "   非UTF-8文件: $NON_UTF8_COUNT"

if [ $NON_UTF8_COUNT -gt 0 ]; then
    echo ""
    echo "??  发现 $NON_UTF8_COUNT 个非UTF-8编码文件:"
    for FILE in "${NON_UTF8_FILES[@]}"; do
        echo "   - $FILE"
    done
    
    if [ "$1" == "--fix" ]; then
        echo ""
        echo "? 正在修复编码问题..."
        for FILE in "${NON_UTF8_FILES[@]}"; do
            echo "修复: $FILE"
            iconv -f gbk -t utf-8 "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
        done
        echo "? 编码修复完成!"
    else
        echo ""
        echo "? 运行 './scripts/check-encoding.sh --fix' 自动修复"
    fi
    
    exit 1
else
    echo "? 所有文件编码正确!"
    exit 0
fi