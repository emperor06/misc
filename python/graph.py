import math

class Node:
	def __init__(self, name, weight):
		self.name   = name
		self.weight = weight

	def __str__(self):
		return f"{self.name}_{self.weight}"

	def __eq__(self, other):
		return isinstance(other, Node) and self.name == other.name

	def __hash__(self):
		return hash(self.name)

	def __lt__(self, other):
		return isinstance(other, Node) and self.weight < other.weight

	def __gt__(self, other):
		return isinstance(other, Node) and self.weight > other.weight

	def __le__(self, other):
		if self != other: return False
		return self.weight <= other.weight

	def __ge__(self, other):
		if self != other: return False
		return self.weight >= other.weight

class DijNode:
	def __init__(self, name):
		self.name = name
		self.dist = math.inf
		self.visited = False
		self.cameFrom = None

	def __str__(self):
		return f"{self.name}_{self.cameFrom}_{self.dist}"


class Graph:
	def __init__(self):
		self.nodes = {}

	def add(self, name, nodes):
		if name in self.nodes:
			raise Exception(f"Node {name} already exists")
		self.nodes[name] = nodes

	def __str__(self):
		res = ""
		for n in self.nodes:
			res += f"{n} -> ["
			for i in range(len(self.nodes[n]) - 1):
				res += str(self.nodes[n][i]) + ", "
			res += str(self.nodes[n][len(self.nodes[n]) - 1]) + "]\n"
		return res

	def smallestPath(self, start, end): # thanks Python for reserving 'from' for a stupid keyword
		# Debug
		print(f"Path finding from {start} to {end}")
		# Initialize the list of nodes
		lst = {}
		cur = None
		for n in self.nodes:
			lst[n] = DijNode(n)
			if n == start:
				cur = lst[n]
				cur.dist = 0
				cur.visited = True
		# Check all nodes, starting with start and ending when there is nothing left to check
		while cur:
			best = None
			bestDist = math.inf
			dc = lst[cur.name].dist
			# Check all the unvisited neighbours of current node
			for n in self.nodes[cur.name]:
				dn = lst[n.name]
				if not dn.visited:
					d = dc + n.weight
					# if the nnew distance is better, update
					if d < dn.dist:
						dn.dist = d
						dn.cameFrom = cur.name
					if dn.dist < bestDist:
						best = n.name
						bestDist = dn.dist
			# keep track of the best candidate for next node
			if bestDist != math.inf: # compute all distances
				cur = lst[best]
				cur.visited = True
			else:
				cur = None
		# At this point, every node in lst are visited with the actual best cost from start
		#for n in lst:
		#	print(str(lst[n]))
		# Make path: rewind from end to build the path
		cur = lst[end]
		while cur.name != start:
			print(f"{cur.name}",  end =" <- ")
			cur = lst[cur.cameFrom]
		print(f"{start}")
		print(f"Total cost: {lst[end].dist}")



g = Graph()
g.add("A", [Node("B", 1), Node("C", 2), Node("D", 3)])
g.add("B", [Node("A", 1), Node("D", 2), Node("E", 2)])
g.add("C", [Node("A", 2)])
g.add("D", [Node("A", 3), Node("B", 2)])
g.add("E", [Node("B", 2)])


print(g)

for n in ["A", "B", "C", "D"]:
	g.smallestPath("E", n)
	print()
