export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

/** Alphabetical, which is how every category picker lists them. */
export const compareCategoriesByName = (a: CustomCategory, b: CustomCategory) =>
  a.name.localeCompare(b.name);
