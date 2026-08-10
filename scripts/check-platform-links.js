#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseYAML } = require('./yaml-parser');

const ROOT_DIR = path.join(__dirname, '..');
const CONCURRENCY = 8;
const TIMEOUT_MS = 15000;

async function checkPlatform(platform) {
  const options = {
    method: 'HEAD',
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': 'KoreaCommerceMap-LinkAudit/1.0' }
  };

  try {
    let response = await fetch(platform.url, options);
    if (response.status === 405) {
      response = await fetch(platform.url, { ...options, method: 'GET' });
    }
    return {
      id: platform.id,
      status: response.status,
      finalUrl: response.url,
      outcome: response.ok ? 'reachable' : 'review'
    };
  } catch (error) {
    return {
      id: platform.id,
      status: null,
      finalUrl: platform.url,
      outcome: 'review',
      error: `${error.name}: ${error.message}`
    };
  }
}

async function mapWithConcurrency(items, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  return results;
}

async function main() {
  const yamlPath = path.join(ROOT_DIR, 'data', 'platforms.yaml');
  const platforms = parseYAML(fs.readFileSync(yamlPath, 'utf8'));
  const results = await mapWithConcurrency(platforms, checkPlatform);
  const reviewItems = results.filter(result => result.outcome === 'review');

  console.log('# Platform link audit');
  console.log('');
  console.log(`- Checked: ${results.length}`);
  console.log(`- Reachable: ${results.length - reviewItems.length}`);
  console.log(`- Manual review: ${reviewItems.length}`);
  console.log('');
  console.log('HTTP failures are review signals only. They never change platform status automatically.');

  if (reviewItems.length > 0) {
    console.log('');
    console.log('| Platform | Result | Final URL |');
    console.log('|---|---|---|');
    for (const result of reviewItems) {
      const detail = result.error || `HTTP ${result.status}`;
      console.log(`| ${result.id} | ${detail} | ${result.finalUrl} |`);
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
