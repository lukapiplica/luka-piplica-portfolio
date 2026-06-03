import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET() {
  const allPosts = await getCollection('blog', ({ data }) => {
    // Exclude drafts in production
    return import.meta.env.PROD ? !data.draft : true;
  });

  const allProjects = await getCollection('projects', ({ data }) => {
    // Exclude drafts in production
    return import.meta.env.PROD ? !data.draft : true;
  });

  const index = [
    ...allPosts.map((post) => {
      const locale = post.data.locale || 'en';
      // Post IDs typically look like "en/welcome-to-velocity.md" or "hr/welcome-to-velocity.mdx"
      // Let's strip locale prefix and extension to get the clean slug
      const slug = post.id
        .replace(new RegExp(`^${locale}/`), '')
        .replace(/\.(md|mdx)$/, '');

      const url = locale === 'en' ? `/blog/${slug}` : `/${locale}/blog/${slug}`;

      return {
        type: 'blog',
        title: post.data.title,
        description: post.data.description,
        tags: post.data.tags || [],
        locale,
        url,
      };
    }),
    ...allProjects.map((project) => {
      const locale = project.data.locale || 'en';
      // Project IDs typically look like "project-name.md" or "hr/project-name.md"
      const slug = project.id
        .replace(new RegExp(`^${locale}/`), '')
        .replace(/\.(md|mdx)$/, '');

      const url = locale === 'en' ? `/projects/${slug}` : `/${locale}/projects/${slug}`;

      return {
        type: 'project',
        title: project.data.title,
        description: project.data.description,
        tags: project.data.tags || [],
        locale,
        url,
      };
    }),
  ];

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
