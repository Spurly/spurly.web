/* Named authors for content files (`author: sarthak` in frontmatter). A page with
   no author is credited to the Spurly organisation. Only real people go here. */
export const AUTHORS = {
  sarthak: {
    name: "Sarthak Vats",
    role: "Founder of Spurly",
    image: "/assets/sarthak.webp",
    linkedin: "https://www.linkedin.com/in/sarthak-vats-793128226",
    path: "/blog/author/sarthak",
    blurb: "Full-stack developer. Builds Spurly end to end.",
  },
};

export function getAuthor(key) {
  return key ? AUTHORS[key] || null : null;
}
