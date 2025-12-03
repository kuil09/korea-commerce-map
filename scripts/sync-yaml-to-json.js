#!/usr/bin/env node

/**
 * YAML에서 JSON으로 플랫폼 데이터 동기화 스크립트
 * platforms.yaml을 읽어 platforms.json을 생성합니다.
 * 이렇게 하면 YAML이 단일 진실 공급원(Single Source of Truth)이 됩니다.
 */

const fs = require('fs');
const path = require('path');
const { parseYAML } = require('./yaml-parser');

// 경로 설정
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

function main() {
  try {
    console.log('🔄 YAML에서 JSON으로 동기화 시작...');
    
    // YAML 파일 읽기
    const yamlPath = path.join(DATA_DIR, 'platforms.yaml');
    const content = fs.readFileSync(yamlPath, 'utf8');
    const platforms = parseYAML(content);
    
    console.log(`📦 ${platforms.length}개의 플랫폼 파싱됨`);
    
    // JSON 파일 쓰기
    const jsonPath = path.join(DATA_DIR, 'platforms.json');
    fs.writeFileSync(jsonPath, JSON.stringify(platforms, null, 2), 'utf8');
    
    console.log(`✅ platforms.json 생성 완료: ${jsonPath}`);
  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
    process.exit(1);
  }
}

main();
