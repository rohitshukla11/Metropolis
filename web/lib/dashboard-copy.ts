/** Dashboard status lines that outlive the component that triggered them. */

/** After a creator releases their photos to a licence (the release box itself disappears at once). */
export const releasedMessage = (id: string) => `Photos released to licence #${id.padStart(4, "0")}. Renders under it can run now.`;
