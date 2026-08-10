const DEFAULT_PLATFORM_METADATA = Object.freeze({
  status: 'unverified',
  verificationStatus: 'unverified',
  lastVerifiedAt: null,
  verifiedFields: [],
  sourceUrls: []
});

function normalizePlatform(platform) {
  return {
    ...platform,
    status: platform.status || DEFAULT_PLATFORM_METADATA.status,
    verificationStatus: platform.verificationStatus || DEFAULT_PLATFORM_METADATA.verificationStatus,
    lastVerifiedAt: platform.lastVerifiedAt || DEFAULT_PLATFORM_METADATA.lastVerifiedAt,
    verifiedFields: Array.isArray(platform.verifiedFields)
      ? platform.verifiedFields
      : DEFAULT_PLATFORM_METADATA.verifiedFields,
    sourceUrls: Array.isArray(platform.sourceUrls)
      ? platform.sourceUrls
      : DEFAULT_PLATFORM_METADATA.sourceUrls
  };
}

function normalizePlatforms(platforms) {
  return platforms.map(normalizePlatform);
}

module.exports = {
  DEFAULT_PLATFORM_METADATA,
  normalizePlatform,
  normalizePlatforms
};
