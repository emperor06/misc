import math


class AdjNode:
	def __init__(self, name, weight):
		self.name = name
		self.weight = weight

	def __str__(self):
		return f"{self.name}_{self.weight}"

	def __repr__(self):
		return f"{self.name}_{self.weight}"

class Graph:

	def __init__(self):
		self.nodes = {}

	def addEdge(self, node1, node2, weight):
		n1 = AdjNode(node1, weight)
		n2 = AdjNode(node2, weight)
		if not node1 in self.nodes:
			self.nodes[node1] = []
		if not node2 in self.nodes:
			self.nodes[node2] = []
		self.nodes[node1].append(n2)
		self.nodes[node2].append(n1)

	def getNeighbours(self, node):
		return self.nodes[node]

	def getNodes(self):
		return self.keys()

	def __repr__(self):
		s = ""
		for node in self.nodes:
			s += f"{node}: "
			s += str(self.nodes[node])
			s += "\n"
		return s

	def dijkstra(self, start, end): # thanks Python for reserving 'from' for a stupid keyword
		# Debug
		print(f"Path finding from {start} to {end}")
		# Initialize the list of nodes
		lst = {}
		for x in self.getNodes():
			lst[x] = map(lambda y: {'name': y.name, 'dist': math.inf, 'visited': False, 'cameFrom': None}, self.getNeighbours())
		cur = lst[start]
		cur['dist'] = 0
		cur['visited'] = True

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
					# if the new distance is better, update
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



def testGraph():
	g = Graph()
	g.addEdge('a', 'b', 1)
	g.addEdge('a', 'c', 2)
	g.addEdge('a', 'd', 3)
	g.addEdge('b', 'd', 2)
	g.addEdge('b', 'e', 2)

	g.displayGraph()
	print(g)

testGraph()
