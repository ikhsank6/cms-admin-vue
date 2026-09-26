/**
 * Section `content` as seen by renderers. Content is admin-authored JSON validated by the
 * registry schema, so renderers read it loosely and guard each field in the template.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SectionContentProps = { content: Record<string, any> }
