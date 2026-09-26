/**
 * Section `content` as seen by renderers. Content is admin-authored JSON validated by the
 * registry schema, so renderers read it loosely and guard each field in the template.
 */
export type SectionContentProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: Record<string, any>
  /** 1-based position among the page's rendered sections — used for the editorial "01/02" kicker. */
  index?: number
}
