create database if not exists papous;
use papous;

drop table if exists papa;
drop table if exists poux;
create table papa (type varchar(30) primary key);
create table poux (type varchar(30) primary key);

insert into papa (type) values ("papas"), ("pas papas");
insert into poux (type) values ("à poux"); /*, ("pas à poux");*/

select "Chez les papous, y'a ";
select concat(
  "des papous ", p1.type, " ", poux.type, " ", p2.type, ","
)
from papa p2, papa p1, poux;
