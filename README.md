# uber-departure-times
Uber Departure Times - Coding Challenge

### Prompt/Problem
The challenge I decided to tackle for the Uber Coding Challenges was "Departure Times." The reason I went with this one is because of the term "real-time," found in the description. I love real-time, I think the process and challenges that accompany applications that attempt to achieve real-time are fascinating. 

### Full-Stack (sorta)
So I built out this application with a fairly robust front-end, though it is worth noting that I spent much more time and took more care architecting the backend of the application.

### My Choices
* Backend: For the back-end I chose Node.js or io.js to be specific. iojs because it keeps more current with the V8 Javascript engine, and it provides more robust ES6 support. See some of the differences here if your curious what the differences are between the [two](https://iojs.org/en/es6.html). iojs allowed me to use a more modern web framework, koa.js which takes advantage of ES6's generators. Moving forward, I wanted to have this application be a "real-time" as I could make it so I also use a websockets framework by the name of "Primus." Along with Primus, I attach a couple of helpful pieces of middleware, primus-emitter and primus-rooms. There are actually not many sacrifices I had to make on the backend, however, if I had more time and was going to see this project through to production, I would have come up with a way to make the server more agnostic to the API that I'm using. Currently, the application (front and back ends) are quite coupled to the jargon, terminology and data structure that is used by the API I chose (NextBus). 
* Frontend: On the frontend, I decided to use Angular for my prototype, or proof-of-concept. I'm not necessarily an Angular diehard, but it does provide a convenient API for quickly bootstrapping apps. I did leave a little to be had here. I would have built out a build process using something like webpack, duo, or browserify so as not to have so many blocking scripts on my page. Furthermore, I would have taken more care in the structure of the frontend application. But like I said, getting something on the frontend up and running was more important given the set timeframe for this project. Lastly, I would have separated the front and backends to make versioning, and deployment more pleasant, but I think we're able to get away with it here because of the projects small size. Its certainly not a structure I'd continue with moving forward. Any changes to the frontend here would require a full deployment and a server bounce. Though the frontend does know how to recover from a lost server connection.
* Hosting: I chose to use Heroku for this project, I've never actually used it previously, but it provided a very quick way to get up and running without spinning up EC2, ElastiCache instances and implementing a server deploy process.

### How it works
* A client comes in a gets served the static, HTML, JS, and CSS. On page load the Angular app will reach out to the server via HTTP GET request to retrieve a list of all agencies.
* After the client chooses an agency a similar action is performed to get a list of the routes listed under the selected agency.
* Lastly, the customer chooses a stop and after that an event is emitted to the server via Websocket which is where the magic happens. This will kick off a worker.
* This worker will hit a "predictions" API endpoint ever two seconds to retrieve the latest assumptions on when the next bus will arrive. An event is then emitted to a "room" of listeners/clients that are interested in getting updates on a particuar bus stop.
* Everytime the client selects a new bus stop, they will be automatically unsubscribed from the pervious stop so as to make the server more effecient and make sure we aren't hitting the NextBus API for no reason.

### Existing Code
I have a view projects/applications in production but the only one that is publicly available is my customer facing, Websocket based, React.js chat client. Do note that it is a built application so dependencies are bundled within the application. [The lines that I have written are from 1 - 1752.](http://s3.amazonaws.com/articulate-main/apps/app-ui/production/latest/articulate.js)

### Links
* [Github Profile](https://github.com/cworsley4)
* [Hosted Project](https://uber-coding-challenge.herokuapp.com)
* [Resume](https://uber-coding-challenge.herokuapp.com/assets/cecil-worsley-resume.pdf)

### Departure Times - Description
Create a service that gives real-time departure time for public transportation
(use freely available public API). The app should geolocalize the user.

Here are some examples of freely available data:

* [511](http://511.org/developer-resources_transit-api.asp) (San Francisco)
* [Nextbus](http://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf) (San
  Francisco)
