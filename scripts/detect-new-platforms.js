#!/usr/bin/env node

/**
 * 새로 추가되거나 URL이 변경된 플랫폼을 감지하는 스크립트
 * base 브랜치와 현재 브랜치의 platforms.yaml을 비교합니다.
 */

const { execSync } = require('child_process');
const { parseYAML } = require('./yaml-parser');

/**
 * Git을 사용해 특정 ref에서 파일 내용을 가져옵니다.
 * @param {string} ref - Git ref (예: 'origin/main', 'HEAD')
 * @param {string} filepath - 파일 경로
 * @returns {string|null} 파일 내용 또는 null
 */
function getFileAtRef(ref, filepath) {
  // Validate ref to prevent command injection
  // Allow alphanumeric, slashes, dashes, underscores, dots, and HEAD
  if (!/^[a-zA-Z0-9/_.\-]+$/.test(ref)) {
    console.error(`Invalid ref format: ${ref}`);
    return null;
  }
  // Validate filepath - only allow alphanumeric, slashes, dashes, underscores, dots
  if (!/^[a-zA-Z0-9/_.\-]+$/.test(filepath)) {
    console.error(`Invalid filepath format: ${filepath}`);
    return null;
  }
  
  try {
    return execSync(`git show ${ref}:${filepath}`, { encoding: 'utf8' });
  } catch {
    return null;
  }
}

/**
 * 플랫폼 배열에서 URL 맵을 생성합니다.
 * @param {Array} platforms - 플랫폼 배열
 * @returns {Map} id -> {url, name} 맵
 */
function createPlatformUrlMap(platforms) {
  const map = new Map();
  for (const platform of platforms) {
    map.set(platform.id, {
      url: platform.url,
      name: platform.name,
      nameEn: platform.nameEn
    });
  }
  return map;
}

/**
 * 새로 추가되거나 URL이 변경된 플랫폼을 찾습니다.
 * @param {string} baseRef - base 브랜치 ref (예: 'origin/main')
 * @param {string} headRef - head 브랜치 ref (예: 'HEAD')
 * @returns {Array} 변경된 플랫폼 배열 [{id, name, nameEn, url, changeType}]
 */
function findChangedPlatforms(baseRef, headRef) {
  const baseContent = getFileAtRef(baseRef, 'data/platforms.yaml');
  const headContent = getFileAtRef(headRef, 'data/platforms.yaml');
  
  if (!headContent) {
    console.error('현재 브랜치에서 platforms.yaml을 찾을 수 없습니다.');
    return [];
  }
  
  const headPlatforms = parseYAML(headContent);
  const headMap = createPlatformUrlMap(headPlatforms);
  
  // base 브랜치에 파일이 없으면 모든 플랫폼이 새로 추가된 것
  if (!baseContent) {
    console.log('base 브랜치에 platforms.yaml이 없습니다. 모든 플랫폼을 새로 추가된 것으로 처리합니다.');
    return headPlatforms.map(p => ({
      id: p.id,
      name: p.name,
      nameEn: p.nameEn,
      url: p.url,
      changeType: 'added'
    }));
  }
  
  const basePlatforms = parseYAML(baseContent);
  const baseMap = createPlatformUrlMap(basePlatforms);
  
  const changedPlatforms = [];
  
  // 새로 추가되거나 URL이 변경된 플랫폼 찾기
  for (const [id, headInfo] of headMap) {
    const baseInfo = baseMap.get(id);
    
    if (!baseInfo) {
      // 새로 추가된 플랫폼
      changedPlatforms.push({
        id,
        name: headInfo.name,
        nameEn: headInfo.nameEn,
        url: headInfo.url,
        changeType: 'added'
      });
    } else if (baseInfo.url !== headInfo.url) {
      // URL이 변경된 플랫폼
      changedPlatforms.push({
        id,
        name: headInfo.name,
        nameEn: headInfo.nameEn,
        url: headInfo.url,
        oldUrl: baseInfo.url,
        changeType: 'url_changed'
      });
    }
  }
  
  return changedPlatforms;
}

// 메인 실행
function main() {
  const baseRef = process.argv[2] || 'origin/main';
  const headRef = process.argv[3] || 'HEAD';
  const outputFile = process.argv[4]; // Optional: file path to write JSON output
  
  console.log(`🔍 플랫폼 변경 감지 중...`);
  console.log(`   Base: ${baseRef}`);
  console.log(`   Head: ${headRef}`);
  
  const changedPlatforms = findChangedPlatforms(baseRef, headRef);
  
  if (changedPlatforms.length === 0) {
    console.log('📋 변경된 플랫폼이 없습니다.');
  } else {
    console.log(`📋 ${changedPlatforms.length}개의 변경된 플랫폼 발견:`);
    for (const p of changedPlatforms) {
      const changeLabel = p.changeType === 'added' ? '🆕 추가됨' : '🔄 URL 변경됨';
      console.log(`   ${changeLabel}: ${p.name} (${p.nameEn})`);
      console.log(`      URL: ${p.url}`);
      if (p.oldUrl) {
        console.log(`      이전 URL: ${p.oldUrl}`);
      }
    }
  }
  
  const jsonOutput = JSON.stringify(changedPlatforms, null, 2);
  
  // If output file is specified, write to file
  if (outputFile) {
    const fs = require('fs');
    fs.writeFileSync(outputFile, jsonOutput, 'utf8');
    console.log(`\n📤 JSON 파일 저장됨: ${outputFile}`);
  } else {
    // Output to stdout (after all console logs)
    console.log('\n📤 JSON 출력:');
    console.log(jsonOutput);
  }
  
  return changedPlatforms;
}

// 모듈로 사용될 때와 직접 실행될 때 구분
if (require.main === module) {
  main();
}

module.exports = { findChangedPlatforms };
