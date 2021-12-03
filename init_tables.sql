-- create table notes (
--   id serial primary key,
--   species_id integer,
--   habitat text,
--   date text,
--   appearance text,
--   vocalisations text,
--   flock_size text,
--   create_time text,
--   user_id integer);

-- insert into notes (species_id, habitat, date, appearance, vocalisations, flock_size, create_time, user_id) values 
-- (1, 'Jungle', '2021-01-01', 'Yellow', 'Loud', '3', '2021-12-02', 2), 
-- (3, 'Forested Area', '2021-06-01', 'Bright Blue', 'Soft and soothing', '10', '2021-12-02', 1),
-- (5, 'At the housing block', '2019-12-01', 'Ugly', 'Loud and ear piercing', '20', '2021-12-03', 3);


-- insert into species (name, scientific_name) values ('Red Junglefowl', 'Gallus gallus'),
-- ('Wandering Whistling Duck', 'Dendrocygna arcuata'),
-- ('Lesser Whistling Duck', 'Dendrocygna javanica'),
-- ('Cotton Pygmy Goose', 'Nettapus coromandelianus'),
-- ('Garganey', 'Spatula querquedula'),
-- ('Northern Shoveler', 'Spatula clypeata'),
-- ('Gadwall', 'Mareca strepera'),
-- ('Eurasian Wigeon', 'Mareca penelope'),
-- ('Northern Pintail', 'Anas acuta'),
-- ('Tufted Duck', 'Aythya fuligula');

-- create table behaviours (
--   id serial primary key,
--   description text
-- );

-- insert into behaviours (description) values ('Walking'), ('Resting'), ('Gathering Nesting Materials'), ('Mobbing'), ('Long Song'), ('Bathing'), ('Preening'), ('Territory Defense'), ('Climbing Tree'), ('Bark Feeding'), ('Hunting');

-- create table notes_behaviours (
--   id serial primary key,
--   notes_id integer,
--   behaviour_id integer
-- );

-- insert into notes_behaviours (notes_id, behaviour_id) values (1,3), (1,5), (2, 4), (2, 7), (2, 8), (3,1), (3,8), (3,2);

create table comments (id serial primary key, content text, user_id integer, notes_id integer, create_time text);

insert into comments (content, user_id, notes_id, create_time) values
('This is a vrey interesting bird!', 1, 1, '2021-11-29'), 
('Agree, it looks pretty too :)', 3, 1, '2021-11-28'),
('This type of bird is hard to come by, luck you!', 2, 2, '2021-10-28'),
('wow rare find!', 3, 2, '2021-11-01'),
('This type of bird is hard to come by, luck you!', 1, 3, '2021-10-28'),
('wow rare find!', 2, 3, '2021-11-01');