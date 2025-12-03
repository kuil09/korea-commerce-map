#!/usr/bin/env node

/**
 * 플랫폼 URL의 스크린샷을 캡처하는 스크립트
 * Playwright를 사용하여 브라우저에서 실제 페이지를 렌더링합니다.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// 스크린샷 저장 디렉토리
const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR || path.join(__dirname, '..', 'screenshots');

/**
 * 스크린샷 저장 디렉토리를 생성합니다.
 */
function ensureScreenshotsDir() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

/**
 * 단일 플랫폼의 스크린샷을 캡처합니다.
 * @param {Object} browser - Playwright 브라우저 인스턴스
 * @param {Object} platform - 플랫폼 정보 {id, name, url}
 * @returns {Object} 결과 {id, name, url, screenshotPath, success, error}
 */
async function capturePlatformScreenshot(browser, platform) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${platform.id}.png`);
  const result = {
    id: platform.id,
    name: platform.name,
    nameEn: platform.nameEn,
    url: platform.url,
    changeType: platform.changeType,
    screenshotPath: null,
    success: false,
    error: null
  };
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul'
  });
  
  const page = await context.newPage();
  
  try {
    console.log(`📸 캡처 중: ${platform.name} (${platform.url})`);
    
    // 페이지 로드 (최대 30초 대기)
    await page.goto(platform.url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 추가 대기 (동적 콘텐츠 로딩용)
    await page.waitForTimeout(2000);
    
    // 스크린샷 캡처
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      type: 'png'
    });
    
    result.screenshotPath = screenshotPath;
    result.success = true;
    console.log(`✅ 완료: ${platform.name}`);
    
  } catch (error) {
    result.error = error.message;
    console.error(`❌ 실패: ${platform.name} - ${error.message}`);
  } finally {
    await context.close();
  }
  
  return result;
}

/**
 * 여러 플랫폼의 스크린샷을 캡처합니다.
 * @param {Array} platforms - 플랫폼 배열 [{id, name, url}]
 * @returns {Array} 결과 배열
 */
async function captureScreenshots(platforms) {
  if (platforms.length === 0) {
    console.log('📋 캡처할 플랫폼이 없습니다.');
    return [];
  }
  
  ensureScreenshotsDir();
  
  console.log(`🚀 ${platforms.length}개의 플랫폼 스크린샷 캡처 시작...`);
  
  const browser = await chromium.launch({
    headless: true
  });
  
  const results = [];
  
  try {
    for (const platform of platforms) {
      const result = await capturePlatformScreenshot(browser, platform);
      results.push(result);
    }
  } finally {
    await browser.close();
  }
  
  // 결과 요약
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(`\n📊 캡처 완료: 성공 ${successCount}개, 실패 ${failureCount}개`);
  
  return results;
}

/**
 * 스크린샷 결과를 마크다운 형식으로 변환합니다.
 * @param {Array} results - 캡처 결과 배열
 * @returns {string} 마크다운 문자열
 */
function generateMarkdownReport(results) {
  if (results.length === 0) {
    return '변경된 플랫폼이 없습니다.';
  }
  
  let markdown = '## 📸 플랫폼 스크린샷 미리보기\n\n';
  markdown += '> 아래 스크린샷은 PR에서 추가/변경된 플랫폼의 실제 웹사이트 화면입니다.\n\n';
  
  for (const result of results) {
    const changeLabel = result.changeType === 'added' ? '🆕 신규 추가' : '🔄 URL 변경';
    
    markdown += `### ${result.name} (${result.nameEn})\n\n`;
    markdown += `- **변경 유형**: ${changeLabel}\n`;
    markdown += `- **URL**: ${result.url}\n`;
    
    if (result.success) {
      // 스크린샷을 base64로 인코딩하여 마크다운에 삽입
      // GitHub Actions에서 아티팩트로 업로드 후 링크 생성
      markdown += `- **상태**: ✅ 캡처 성공\n\n`;
      markdown += `![${result.name} 스크린샷](screenshots/${result.id}.png)\n\n`;
    } else {
      markdown += `- **상태**: ❌ 캡처 실패\n`;
      markdown += `- **오류**: ${result.error}\n\n`;
    }
    
    markdown += '---\n\n';
  }
  
  return markdown;
}

// 메인 실행
async function main() {
  // stdin에서 플랫폼 JSON 읽기 또는 인자로 받기
  let platforms = [];
  
  if (process.argv[2]) {
    try {
      platforms = JSON.parse(process.argv[2]);
    } catch {
      console.error('❌ 플랫폼 JSON 파싱 오류');
      process.exit(1);
    }
  } else {
    // stdin에서 읽기
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const input = Buffer.concat(chunks).toString('utf8');
    if (input.trim()) {
      try {
        platforms = JSON.parse(input);
      } catch {
        console.error('❌ stdin JSON 파싱 오류');
        process.exit(1);
      }
    }
  }
  
  const results = await captureScreenshots(platforms);
  
  // 마크다운 보고서 생성
  const markdown = generateMarkdownReport(results);
  
  // 결과 파일 저장
  const reportPath = path.join(SCREENSHOTS_DIR, 'report.md');
  fs.writeFileSync(reportPath, markdown, 'utf8');
  console.log(`\n📝 마크다운 보고서 저장됨: ${reportPath}`);
  
  // JSON 결과 저장
  const jsonPath = path.join(SCREENSHOTS_DIR, 'results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`📤 JSON 결과 저장됨: ${jsonPath}`);
  
  // 실패가 있으면 경고
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.warn(`\n⚠️ ${failures.length}개의 플랫폼에서 스크린샷 캡처 실패`);
  }
  
  return results;
}

// 모듈로 사용될 때와 직접 실행될 때 구분
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
}

module.exports = { captureScreenshots, generateMarkdownReport };
