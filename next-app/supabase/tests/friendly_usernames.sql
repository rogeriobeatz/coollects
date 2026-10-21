-- Read-only regression examples for private.username_slug(text).
-- Expected values must match. Run after the friendly-usernames migration.
with examples(input,expected) as (values
 ('João da Silva','joao_da_silva'),
 ('María-Luísa','maria_luisa'),
 ('Rogério Gonçalves','rogerio_goncalves'),
 ('D''Ávila','d_avila'),
 ('Ana.Clara+HW','ana_clara_hw'),
 ('  ___Pedro!  ','pedro'),
 ('A','a'),
 ('🚗','')
)
select input, expected, private.username_slug(input) as actual,
       private.username_slug(input) = expected as passed
from examples;
