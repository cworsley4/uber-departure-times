server-local:
	@DEBUG=uber* PORT=3000 NODE_ENV=development node index.js

server-production:
	@DEBUG=uber* NODE_ENV=production iojs index.js
