/**
 * Static UI copy for the Import page shell (tabs, header).
 *
 * STATIC only — see leads/strings.js for the scope this follows. The bulk of
 * this feature's copy lives in components/{UploadPanel,StagingPanel,
 * FieldMappingPanel}.jsx instead of here: it's built from the CSV being
 * imported (headers, counts, mapping state) rather than fixed strings, so
 * pulling it out here would just be indirection over a template.
 */
export const importStrings = {
  pageTitle: 'Import',
  pageSubtitle: 'Import a CSV, enrich the leads, then send them to the Hub.',
  tabs: {
    staged: 'Staged leads',
    upload: 'Import CSV',
  },
};
