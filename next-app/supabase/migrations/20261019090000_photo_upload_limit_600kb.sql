-- Cap new collectible photo uploads at 600 decimal KB. Existing stored files
-- are NOT rewritten/deleted; their signed URLs remain usable.
-- The browser also compresses images before upload and the API rejects oversize.
update storage.buckets
set file_size_limit = 600000
where id = 'coollects-items';
