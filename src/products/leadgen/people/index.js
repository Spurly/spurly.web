/**
 * The leadgen VIEW of the shared lead book.
 *
 * The People data layer — api, controller, columns, cells, filters, the detail
 * sidebar — stays in platform/people, because the hub product will render the
 * same leads. This page is leadgen-specific: its bulk actions create leadgen
 * campaigns, which is exactly why the boundary lint rejected it inside
 * platform (platform may not import a product).
 */
export { PeoplePage } from './PeoplePage.jsx';
