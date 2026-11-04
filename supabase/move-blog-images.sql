-- Run once in Supabase > SQL Editor.
-- The blog cover photos were copied from Supabase Storage into the website (PNTC Colleges/blog/images/),
-- where Cloudflare serves them for free. This points the blog posts at the copies, so visitors no longer
-- download them from Supabase (which counts against the free tier egress).

update posts
set "featuredImage" = replace(replace("featuredImage",
      'https://midwnqxghejnkzagnnjp.supabase.co/storage/v1/object/public/site-images/PNTC%20Colleges/uploads/featured/',
      '/college/blog/images/'), '.jfif', '.jpg')
where "featuredImage" like 'https://midwnqxghejnkzagnnjp.supabase.co/storage/%PNTC%20Colleges/uploads/featured/%';

update posts
set content = replace(replace(content,
      'https://midwnqxghejnkzagnnjp.supabase.co/storage/v1/object/public/site-images/PNTC%20Colleges/uploads/featured/',
      '/college/blog/images/'), '2h3j.jfif', '2h3j.jpg')
where content like '%midwnqxghejnkzagnnjp.supabase.co/storage/%PNTC%20Colleges/uploads/featured/%';

-- Check: this should return no rows
select id, title, "featuredImage" from posts where "featuredImage" like '%supabase.co/storage%';
