######
# RSA, by Drax (théorie en fin de document)
#
# p, q = deux nombres premiers distincts grands, d'ordre de grandeur semblable.
# N = p*q = modulo RSA (grand nombre composite produit de deux premiers)
# e = clé publique (premier + premier avec phi(N))
# d = clé privée, inverse modulaire de e sur phi(N)
# m = message en clair (plain text)
# c = message chiffré (cipher text)
#
# Pour chiffrer un message m avec la clé publique e :
# c = m^e mod N
#
# Pour déchiffrer le cipher text c avec la clé privée :
# m = c^d mod N
#

########
# Outils
# On va avoir besoin de deux fonctions pour des calculs compliqués :
# 1) un moyen de calculer la clé privée d, c'est à dire un inverse modulaire
# 2) un moyen de calculer a^b mod n pour des nombres a, b, n très grands
#    (exponentiation modulaire)

###
# modexp - Exponentiation modulaire (explications en fin de document)
# Entrée = a, b, n trois entiers
# Sortie = a^b mod n
def modexp(a, b, n) :
    res = 1
    x = a % n
    while b > 0 :
        if b & 1 :
            res = (res * x) % n
        b >>= 1
        x = (x * x) % n
    return res

###
# modinv - inverse modulaire (explications en fin de document)
# C'est l'algorithme étendu d'Euclide.
# Entrée = a, n entiers
# Sortie = b tel que ab ≡ 1 mod n
# Condition : a et n doivent être premiers entre eux (gcd(a, n) == 1)
# Note : si n est premier, on peut utiliser le petit théorème de Fermat et faire
# un algo beaucoup plus rapide, mais dans RSA ce n'est pas le cas.
def modinv(a, n) :
    # cas trivial
    if (n == 1) :
        return 0

    m = n
    x = 1
    y = 0

    while (a > 1) :
        q = a // m

        # Comme pour gcd, on remplace m par a%m et a par m
        tmp = m
        m = a % m
        a = tmp

        # Et on applique les même transfo à x et y
        tmp2 = y
        y = x - q * y
        x = tmp2

    # On veut le résultat entre 0 et n-1
    if (x < 0) :
        x = x + n

    return x

######
# RSA

# On choisit deux entiers p et q différents, tous deux premiers, d'ordre de grandeur
# similaire
p = 102061
q = 66523
N = p*q
phi = (p - 1)*(q - 1)
e = 17 # un petit nombre premier tq gcd(e, phi) = 1
d = modinv(e, phi)

print("N = %d, e = %d, d = %d" % (N, e, d))

m = 140789
print("message (14 juillet 89) = %d" % m)
print("Chiffrement avec la clé publique (%d ; %d)" % (N, e))
c = modexp(m, e, N)
print("message chiffré = %d" % c)
print("Déchiffrement avec la clé privée (%d ; %d)" % (N, d))
decode = modexp(c, d, N)
print("message déchiffré = %d" % decode)

print(modexp(654987654, 12387458, 68687354354))

####################
# Théorie et maths #
#
# RSA fait intervenir le totient d'Euler phi(n) où phi(n) = le nombre
# d'entiers inférieurs ou égaux à n qui sont premiers avec n.
# Note 1 : en vrai, il me semble que RSA utilise maintenant le totient de
# Carmichael, qui est une version réduite du totient d'Euler, mais ça ne change
# rien au principe.
# Note 2 : calculer phi(n) est réputé difficile, sauf si n est premier ou si on
# connait sa décomposition en facteurs premiers.
# Note 3 : important, dans le cas où N = pq avec p et q premiers,
# phi(N) = (p-1)(q-1) (merci Euler) car phi est multiplicative (phi(ab)=phi(a)*phi(b))
# et phi(p) = p - 1 si p est premier (entre 0 et p, le seul nombre n'étant pas
# premier avec p est p lui-même)
#
# Il faut prouver que pour tout 0 <= m < N, (m^e)^d = m^(ed) ≡ m mod N,
# c'est à dire que déchiffrer un truc chiffré nous redonne toujours le message
# d'origine.
#
# On a :
# (1) gcd(p, q) = 1 (car p et q sont premiers et p != q)
# (2) N = pq (par définition de N dans RSA)
# (3) ed ≡ 1 mod phi(N), par définition d est l'inverse modulaire de e sur phi(N),
#
# 0 <= m < N
# Dans le cas général, on a gcd(m, N) = 1
# On peut alors utiliser le théorème d'Euler :
# m^phi(N) ≡ 1 mod N
# D'après (3), ed = 1 + k*phi(N)
# => m^(ed) = m^(1 + k*phi(N)) = m * m^(k*phi(N)) = m * [m^(phi(N))]^k
# comme m^phi(N) ≡ 1 mod N (Euler), [m^phi(N)]^k ≡ 1^k ≡ 1 mod N
# d'où m * [m^(phi(N))]^k = m^(ed) ≡ m mod N (cqfd)
#
# En fait, on vient plus ou moins de démontrer le corollaire du théorème d'Euler.
# Si a et n sont coprimes (gcd(a, n)=1), alors
# x ≡ y (mod phi(n)) => a^x ≡ a^y (mod n)
# Et donc ed ≡ 1 (mod phi(n)) => m^(ed) ≡ m^1 (mod n), cqfd.
#
# Dans le cas particulier où gcd(m, N) != 1, c'est un peu plus cotton.
# Déjà, notons que ce cas est extrêment rare ! En effet, ça n'arrive que si le
# message m est un multiple de p ou de q. Avec du RSA 2048 bits, on a beaucoup
# plus de chances de gagner au loto.
# Notons également que ça pouvait poser pb au RSA original car les auteurs
# n'imposaient pas p != q.
# Notons également que p = q est un choix idiot car factoriser N se fait en un
# coup (p = q = sqrt(N)).
# Enfin, notons que si gcd(m, N) != 1 alors on peut utiliser le gcd pour factoriser
# N et casser l'algo. Mais pour forger un message m tel que gcd(m, N) != 1, c'est
# aussi difficile que factoriser N de toute façon...
#
# On peut utiliser le théorème des restes chinois.
# D'après (1), gcd(p, q) = 1 donc
# x ≡ y mod p et x ≡ y mod q => x ≡ y mod (pq) (donc mod N)
# Il suffit donc de prouver que :
# (a) (m^e)^d ≡ m mod p et
# (b) (m^e)^d ≡ m mod q
# Comme gcd(m, N) != 1, on a soit gcd(m, N) = p, soit gcd(m, N) = q.
# Les rôles de p et q étant interchangeables, supposons gcd(m, N) = p (et ça
# vaudra pour q).
# (a)
# gcd(m, N) = p => m = kp => m mod p = 0.
# De plus, (m^e)^d = (kp)^(ed) qui est un multiple de p donc (kp)^(ed) = 0 mod p
# On a donc (m^e)^d mod p = 0 = m mod p, ce qui prouve (a)
#
# (b)
# Puisqu'on a choisi gcd(m, p) != 1, on a gcd(m, q) = 1, donc on peut appliquer
# le théorème d'Euler : m^phi(q) ≡ 1 (mod q)
# Remarquons que d'une part phi(N) = (p-1)(q-1) et d'autre part (3)
# ed ≡ 1 (mod phi(N))
# Donc phi(N) = (p-1)(q-1) divise ed - 1, c'est à dire qu'il existe k positif tq
# ed = k(p-1)(q-1) + 1
# Les égalités suivantes sont toutes modulo q :
# (m^e)^d = m^(ed)
#         = m^(ed - 1) * m
#         = m^(k(p-1)(q-1)) * m
#         = [m^(q-1)]^(k(p-1)) * m
# Le petit théorème de Fermat nous dit que pour tout m, m^(q-1) ≡ 1 (mod q) (si q premier)
#         = 1^(k(p-1)) * m
#         = m
# Donc (m^e)^d ≡ m (mod q), ce qui prouve (b) et conclut le cas gcd(m, N) != 1

###
# modexp
# Avec des grands nombres, a^b devient gigantesque (trop gros pour tenir dans un
# entier, même en 64 bits). Le calcul est également fastidieux.
#
# On va utiliser quelques propriétés des puissances et des modulos.
# x^(a+b) = x^a * x^b (permet d'accelérer les calculs de puissance)
# (a*b) mod n = [(a mod n)*(b mod n)] mod n (permet de garder des nombres petits
# en modulant au fur et à mesure)
# Prenons un exemple : x^19 mod n
# De manière naïve, je peux le calculer en faisant 18 multiplication (x*x...*x)
# Posons C0 = x mod n
# Commençons par un carré : C1 = x^2 mod n = (x*x) mod n = (x mod n)(x mod n) mod n
# Soit C1 = C0^2 mod n
# Maintenant que j'ai x^2, je peux facilement trouver (x^2)^2 = x^4, c'est à dire
# C2 = x^4 mod n = (x^2 mod n)(x^2 mod n) mod n = C1^2 mod n
# De même, je trouve C3 = x^8 mod n = (x^4 mod n)^2 mod n = C2^2 mod n
# Et x^16 mod n = C4 = C3^2 mod n.
# Ce qui m'intéresse c'est x^19 donc pas la peine de calculer C5 = x^32 mod n
# car on dépasse.
# On remarque que 19 = 16 + 2 + 1 donc x^19 mod n = x^(16+2+1) mod n
# = (x^16 * x^2 * x) mod n = (x^16 mod n * x^2 mod n * x mod n) mod n
# Et ça tombe bien, on connait déjà tous les termes !
# x^19 mod n = (C4 * C1 * C0) mod n
# J'ai donc juste eu besoin de calculer C1..C4, c'est à dire 4 multiplications
# et 4 modulos avec des nombres relativement petits. On rajoute un modulo pour
# le premier terme C0 = x mod n, la dernière multiplication C4*C1*C0 et le
# dernier modulo. C'est moins cher payé que la technique naïve et ses 18 multi-
# plications de grands nombres.
# On constate que 19 = 16 + 2 + 1 n'est autre que la décomposition de 19 en base 2
# La complexité de l'algorithme est donc O(log2(n)) ce qui est méchamment plus
# performant que la technique naïve (linéaire).
# L'algo est donc très simple : on écrit l'exposant en binaire
# 19(10) = 10011(2), on boucle sur les bits en partant du bit de poids le plus
# faible, on construit les x^2k au fur et à mesure et on les rajoute au résultat
# si le bit est à 1
#
# Pour reprendre le code en le commentant :
# x = a % n # C0
# while b > 0 : # on boucle sur les bits de b
#    if b & 1 : # si bit de poids faible à 1
#        res = (res * x) % n # on ajoute Ck au résultat, res = res * Ck mod n
#    b >>= 1    # on passe au bit suivant avec un bitshift (ça dégage le dernier bit)
#    x = (x * x) % n # on calcule C(k+1), le carré du Ck modulo n
#
# Pour celui qui n'est pas familier avec le bitshift à droite : ça décalle tous
# bits d'un cran vers la droite donc 10011 >> 1 => 01001 (le dernier bit saute)
# A force de décaller, il ne reste plus rien dans b (b == 0, ce qui stoppe la
# boucle)

###
# modinv - inverse modulaire = algo d'Euclide étendu
# Je ne vais pas détailler l'algo, on le trouve partout sur le web, mais voici
# pourquoi c'est pertinent.
# Dans l'algo d'Euclide, on cherche le gcd.
# Dans sa version étendue, en plus du gcd, on a les coef de l'identité de Bézout
# ax + by = gcd(a,b)
# C'est intéressant car, par définition dans RSA, on veut que e et phi(N) soient
# premiers entre eux, donc gcd(e, phi(N)) = 1
# En prenant a = e et b = phi(N), l'identité de Bézout devient :
# ex + phi(N)y = 1
# soit ex = -phi(N)y + 1, c'est à dire ex ≡ 1 (mod phi(N))
# Calculer x, c'est donc calculer l'inverse de e modulo phi(N), ce qui est la
# définition de d (la clé privée).
