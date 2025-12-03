#!/usr/bin/env node

/**
 * llms.txt 생성 스크립트
 * 템플릿과 데이터 파일을 사용하여 llms.txt를 생성합니다.
 */

const fs = require('fs');
const path = require('path');

// 경로 설정
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');

// 데이터 파일 로드
function loadJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`데이터 파일을 찾을 수 없습니다: ${filepath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`JSON 파싱 오류 (${filename}): ${error.message}`);
    }
    throw error;
  }
}

// 템플릿 파일 로드
function loadTemplate(filename) {
  const filepath = path.join(TEMPLATES_DIR, filename);
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`템플릿 파일을 찾을 수 없습니다: ${filepath}`);
    }
    throw error;
  }
}

// 카테고리별로 플랫폼 그룹화
function groupPlatformsByCategory(categories, platforms) {
  const result = [];
  
  // 카테고리 순서 정의 (표시하고 싶은 순서)
  const categoryOrder = ['general', 'quick-commerce', 'fresh', 'grocery', 'food-delivery', 'fashion', 'beauty', 'electronics', 'living', 'secondhand'];
  
  // 이미 할당된 플랫폼 추적
  const assignedPlatforms = new Set();
  
  for (const categoryId of categoryOrder) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) continue;
    
    // 이 카테고리에 속하고 아직 할당되지 않은 플랫폼 찾기
    const categoryPlatforms = platforms.filter(p => 
      p.categories.includes(categoryId) && !assignedPlatforms.has(p.id)
    );
    
    if (categoryPlatforms.length > 0) {
      // 플랫폼을 할당됨으로 표시
      categoryPlatforms.forEach(p => assignedPlatforms.add(p.id));
      
      result.push({
        categoryId,
        categoryName: category.name,
        categoryNameEn: category.nameEn,
        platforms: categoryPlatforms
      });
    }
  }
  
  return result;
}

// 중첩된 {{#each}}...{{/each}} 블록을 찾는 함수
function findMatchingEachBlock(str, startTag) {
  const startIndex = str.indexOf(startTag);
  if (startIndex === -1) return null;
  
  let depth = 1;
  let pos = startIndex + startTag.length;
  const openTag = '{{#each';
  const closeTag = '{{/each}}';
  
  while (pos < str.length && depth > 0) {
    const nextOpen = str.indexOf(openTag, pos);
    const nextClose = str.indexOf(closeTag, pos);
    
    if (nextClose === -1) break;
    
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + openTag.length;
    } else {
      depth--;
      if (depth === 0) {
        return {
          fullMatch: str.substring(startIndex, nextClose + closeTag.length),
          content: str.substring(startIndex + startTag.length, nextClose),
          startIndex,
          endIndex: nextClose + closeTag.length
        };
      }
      pos = nextClose + closeTag.length;
    }
  }
  
  return null;
}

// 배송 수단 목록 추출
function extractDeliveryMethods(platforms) {
  const methods = new Set();
  platforms.forEach(p => p.deliveryMethods.forEach(d => methods.add(d)));
  return Array.from(methods).sort();
}

// 간단한 템플릿 렌더링
function renderTemplate(template, data) {
  let result = template;
  
  // {{deliveryMethodsList}} 처리 (단순 변수 치환)
  const deliveryMethods = extractDeliveryMethods(data.platforms);
  const deliveryMethodsList = deliveryMethods.map(d => `- ${d}`).join('\n');
  result = result.replace(/\{\{deliveryMethodsList\}\}/g, deliveryMethodsList);
  
  // 여러 개의 {{#each categories}} 블록 처리
  while (result.includes('{{#each categories}}')) {
    const categoriesBlock = findMatchingEachBlock(result, '{{#each categories}}');
    if (categoriesBlock) {
      const rendered = data.categories.map(category => {
        let itemContent = categoriesBlock.content;
        itemContent = itemContent.replace(/\{\{name\}\}/g, category.name);
        itemContent = itemContent.replace(/\{\{nameEn\}\}/g, category.nameEn);
        itemContent = itemContent.replace(/\{\{icon\}\}/g, category.icon);
        itemContent = itemContent.replace(/\{\{id\}\}/g, category.id);
        return itemContent;
      }).join('');
      result = result.replace(categoriesBlock.fullMatch, rendered);
    } else {
      break;
    }
  }
  
  // {{#each platformsByCategory}} ... {{/each}} 처리 (중첩된 each 포함)
  const platformsByCategoryBlock = findMatchingEachBlock(result, '{{#each platformsByCategory}}');
  if (platformsByCategoryBlock) {
    const rendered = data.platformsByCategory.map(group => {
      let groupContent = platformsByCategoryBlock.content;
      groupContent = groupContent.replace(/\{\{categoryName\}\}/g, group.categoryName);
      groupContent = groupContent.replace(/\{\{categoryNameEn\}\}/g, group.categoryNameEn);
      
      // 중첩된 {{#each platforms}} ... {{/each}} 처리
      const platformsBlock = findMatchingEachBlock(groupContent, '{{#each platforms}}');
      if (platformsBlock) {
        const platformsRendered = group.platforms.map(platform => {
          let itemContent = platformsBlock.content;
          itemContent = itemContent.replace(/\{\{name\}\}/g, platform.name);
          itemContent = itemContent.replace(/\{\{nameEn\}\}/g, platform.nameEn);
          itemContent = itemContent.replace(/\{\{url\}\}/g, platform.url);
          itemContent = itemContent.replace(/\{\{deliveryTime\}\}/g, platform.deliveryTime);
          itemContent = itemContent.replace(/\{\{description\}\}/g, platform.description);
          return itemContent;
        }).join('');
        groupContent = groupContent.replace(platformsBlock.fullMatch, platformsRendered);
      }
      
      return groupContent;
    }).join('');
    
    result = result.replace(platformsByCategoryBlock.fullMatch, rendered);
  }
  
  return result;
}

// 메인 실행
function main() {
  try {
    console.log('🚀 llms.txt 생성 시작...');
    
    // 데이터 로드
    const categories = loadJSON('categories.json');
    const platforms = loadJSON('platforms.json');
    
    console.log(`📦 ${categories.length}개의 카테고리 로드됨`);
    console.log(`📦 ${platforms.length}개의 플랫폼 로드됨`);
    
    // 템플릿 로드
    const template = loadTemplate('llms.txt.template');
    
    // 카테고리별로 플랫폼 그룹화
    const platformsByCategory = groupPlatformsByCategory(categories, platforms);
    
    // 템플릿 데이터 준비
    const templateData = {
      categories,
      platforms,
      platformsByCategory
    };
    
    // 템플릿 렌더링
    const output = renderTemplate(template, templateData);
    
    // 파일 저장
    const outputPath = path.join(ROOT_DIR, 'llms.txt');
    try {
      fs.writeFileSync(outputPath, output, 'utf8');
    } catch (error) {
      throw new Error(`파일 저장 실패 (${outputPath}): ${error.message}`);
    }
    
    console.log(`✅ llms.txt 생성 완료: ${outputPath}`);
  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
    process.exit(1);
  }
}

main();
