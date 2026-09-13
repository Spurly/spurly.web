/**
 * Static UI copy for the Templates page.
 *
 * STATIC only — see leads/strings.js for the scope this follows. Copy built
 * from a specific template (its name, content, usage count) stays inline
 * where it's assembled, in index.jsx and components/TemplateCard.jsx.
 */
export const templatesStrings = {
  pageTitle: 'Templates',
  pageSubtitle: 'Reusable copy for connection notes and messages.',
  tabs: {
    connection: {
      label: 'Connection notes',
      blurb: 'The note attached to a LinkedIn invitation.',
    },
    message: {
      label: 'Messages',
      blurb: 'Sent to people you’re already connected with.',
    },
  },
  newTemplate: 'New template',
  searchPlaceholder: 'Search templates…',
  emptySearch: 'No templates match your search',
  emptyAll: 'No templates yet',
  emptySearchHint: 'Try a different search term.',
  editor: {
    newHeading: 'New template',
    editHeading: 'Edit template',
    connectionSubtitle: 'Attached to the invitation. Keep it under 200 characters.',
    messageSubtitle: 'Sent as a LinkedIn message to your connections.',
  },
  toasts: {
    updated: 'Template updated',
    created: 'Template created',
    saveErrorFallback: "Couldn't save the template",
    deleteErrorFallback: "Couldn't delete the template",
    duplicated: 'Template duplicated',
    duplicateErrorFallback: "Couldn't duplicate the template",
    addedFavorite: 'Added to favorites',
    removedFavorite: 'Removed from favorites',
    favoriteErrorFallback: "Couldn't update this favorite",
  },
  confirmDelete: {
    descriptionSuffix: "This can't be undone.",
    confirmLabel: 'Delete template',
  },
};
