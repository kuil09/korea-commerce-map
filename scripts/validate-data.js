#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseYAML } = require('./yaml-parser');
const { normalizePlatforms } = require('./platform-metadata');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const REQUIRED_FIELDS = [
  'id',
  'name',
  'nameEn',
  'description',
  'url',
  'categories',
  'deliveryMethods',
  'deliveryTime',
  'minOrderAmount',
  'features'
];
const PLATFORM_STATUSES = new Set([
  'active',
  'rebranded',
  'suspended',
  'closed',
  'unverified'
]);
const VERIFICATION_STATUSES = new Set(['verified', 'partial', 'unverified']);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function loadJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
}

function isNonEmpty(value) {
  return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== '';
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isIsoDate(value) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validate() {
  const errors = [];
  const categories = loadJson('categories.json');
  const categoryIds = new Set();

  for (const category of categories) {
    if (!ID_PATTERN.test(category.id)) {
      errors.push(`Category has an invalid id: ${category.id}`);
    }
    if (categoryIds.has(category.id)) {
      errors.push(`Duplicate category id: ${category.id}`);
    }
    categoryIds.add(category.id);
  }

  const yamlContent = fs.readFileSync(path.join(DATA_DIR, 'platforms.yaml'), 'utf8');
  const platforms = normalizePlatforms(parseYAML(yamlContent));
  const platformIds = new Set();

  for (const platform of platforms) {
    for (const field of REQUIRED_FIELDS) {
      if (!isNonEmpty(platform[field])) {
        errors.push(`${platform.id || '<unknown>'} is missing required field: ${field}`);
      }
    }

    if (!ID_PATTERN.test(platform.id)) {
      errors.push(`Platform has an invalid id: ${platform.id}`);
    }
    if (platformIds.has(platform.id)) {
      errors.push(`Duplicate platform id: ${platform.id}`);
    }
    platformIds.add(platform.id);

    if (!isHttpsUrl(platform.url)) {
      errors.push(`${platform.id} has an invalid HTTPS URL: ${platform.url}`);
    }
    for (const categoryId of platform.categories) {
      if (!categoryIds.has(categoryId)) {
        errors.push(`${platform.id} references unknown category: ${categoryId}`);
      }
    }

    if (!PLATFORM_STATUSES.has(platform.status)) {
      errors.push(`${platform.id} has an invalid status: ${platform.status}`);
    }
    if (!VERIFICATION_STATUSES.has(platform.verificationStatus)) {
      errors.push(`${platform.id} has an invalid verificationStatus: ${platform.verificationStatus}`);
    }

    if (platform.lastVerifiedAt !== null && !isIsoDate(platform.lastVerifiedAt)) {
      errors.push(`${platform.id} has an invalid lastVerifiedAt date: ${platform.lastVerifiedAt}`);
    }

    if (platform.verificationStatus !== 'unverified') {
      if (!platform.lastVerifiedAt) {
        errors.push(`${platform.id} requires lastVerifiedAt when verificationStatus is ${platform.verificationStatus}`);
      }
      if (platform.verifiedFields.length === 0) {
        errors.push(`${platform.id} requires verifiedFields when verificationStatus is ${platform.verificationStatus}`);
      }
      if (platform.sourceUrls.length === 0) {
        errors.push(`${platform.id} requires sourceUrls when verificationStatus is ${platform.verificationStatus}`);
      }
    }

    for (const field of platform.verifiedFields) {
      if (!(field in platform)) {
        errors.push(`${platform.id} lists an unknown verified field: ${field}`);
      }
    }
    for (const sourceUrl of platform.sourceUrls) {
      if (!isHttpsUrl(sourceUrl)) {
        errors.push(`${platform.id} has an invalid source URL: ${sourceUrl}`);
      }
    }
  }

  const generatedPlatforms = loadJson('platforms.json');
  if (JSON.stringify(platforms) !== JSON.stringify(generatedPlatforms)) {
    errors.push('data/platforms.json is not synchronized with data/platforms.yaml');
  }

  if (errors.length > 0) {
    console.error(`Data validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  const verifiedCount = platforms.filter(platform => platform.verificationStatus === 'verified').length;
  const partialCount = platforms.filter(platform => platform.verificationStatus === 'partial').length;
  const unverifiedCount = platforms.length - verifiedCount - partialCount;
  console.log(
    `Validated ${platforms.length} platforms and ${categories.length} categories ` +
    `(verified: ${verifiedCount}, partial: ${partialCount}, unverified: ${unverifiedCount}).`
  );
}

validate();
