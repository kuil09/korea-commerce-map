/**
 * 간단한 YAML 파서 (platforms.yaml 구조에 맞춤)
 * 공통 모듈로 사용됩니다.
 */

function parseYAML(content) {
  const lines = content.split('\n');
  const platforms = [];
  let currentPlatform = null;
  let currentArrayKey = null;
  let inPlatforms = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // 주석이나 빈 줄 무시
    if (trimmed.startsWith('#') || trimmed === '') continue;
    
    // platforms: 섹션 시작
    if (trimmed === 'platforms:') {
      inPlatforms = true;
      continue;
    }
    
    if (!inPlatforms) continue;
    
    // 새 플랫폼 시작 (- id:)
    if (line.match(/^  - id:/)) {
      if (currentPlatform) {
        platforms.push(currentPlatform);
      }
      const value = trimmed.replace('- id:', '').trim();
      currentPlatform = { id: value };
      currentArrayKey = null;
      continue;
    }
    
    if (!currentPlatform) continue;
    
    // 배열 항목 (- "value" 또는 - value)
    if (line.match(/^      - /)) {
      const value = trimmed.replace(/^- /, '').replace(/^"(.*)"$/, '$1');
      if (currentArrayKey && currentPlatform[currentArrayKey]) {
        currentPlatform[currentArrayKey].push(value);
      }
      continue;
    }
    
    // 키-값 쌍 (key: value 또는 key:)
    if (line.match(/^    \w+:/)) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex);
      let value = trimmed.substring(colonIndex + 1).trim();
      
      // 배열 시작
      if (value === '') {
        currentArrayKey = key;
        currentPlatform[key] = [];
      } else {
        // 문자열 값
        value = value.replace(/^"(.*)"$/, '$1');
        currentPlatform[key] = value;
        currentArrayKey = null;
      }
    }
  }
  
  // 마지막 플랫폼 추가
  if (currentPlatform) {
    platforms.push(currentPlatform);
  }
  
  return platforms;
}

module.exports = { parseYAML };
