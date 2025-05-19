-- Load with psql -h localhost -U drax -d draxdb -P 'null=\N' -f recursion.sql
create schema if not exists tree;
set search_path to tree;

create table if not exists node (
	id int not null,
	parent int default null,
	seq int not null,
	name varchar(64) not null check (name <> ''),
	url varchar(64) default '',
	primary key(id)
);
alter table node OWNER to drax;
truncate node; -- make sure it's empty

copy node (id, parent, seq, name, url) from STDIN;
1	\N	1	root	
2	1	1	People	people
3	1	2	Data	data
4	2	1	Employees	employees
5	2	2	Customers	customers
6	3	1	Files	files
7	6	1	Images	images
8	6	2	Binaries	bin
9	3	2	Logs	log
\.

select * from node;

WITH RECURSIVE menu_tree
	(id, name, url, level, parent, seq)
AS (
	SELECT
		id,
		name,
		'' || url,
		0,
		parent,
		1
	FROM node
	WHERE parent is NULL
UNION ALL
	SELECT
		mn.id,
		mn.name,
		mt.url || '/' || mn.url,
		mt.level + 1,
		mt.id,
		mn.seq
	FROM node mn, menu_tree mt
	WHERE mn.parent = mt.id
)
SELECT * FROM menu_tree
WHERE level > 0
ORDER BY level, parent, seq;

