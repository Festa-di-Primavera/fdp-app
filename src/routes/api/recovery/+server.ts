import * as fs from 'fs';

export async function POST({request}) {
	// write on static/codes.csv the phrase "server"
	// TODO: check if the ticketID is in the csv
	const body = await request.json()
	// find body.ticketID in the csv
	
	const file = fs.openSync("static/test.csv", "rw")
	
	// find
	const buffer = Buffer.alloc(1024)
	fs.readSync(file, buffer, 0, 1024, 0)

	// write
	

	
	const now = Date.now()
	
	fs.writeFileSync("static/test.csv", "server")
	
	const dopo = Date.now()

	console.log("diff", dopo - now)

	return new Response("server")
}