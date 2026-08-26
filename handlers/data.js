import { DatabaseSync } from 'node:sqlite';

// handles database stuff
export class DataClient {
	db = new DatabaseSync(`${import.meta.dirname}/../db.sqlite`);

	constructor() { }

	async init() {
		console.log('init running...')
		this.db.exec(`create table if not exists users (
				user_id text,
				access text,
				refresh text
			);

			create table if not exists garden (
				user_id text,
				amount integer
			);
		`);
	}

	getToken(id) {
		return this.db.prepare('select * from users where user_id = ?').get(id);
	}

	createToken(id) {
		return this.db.prepare('insert into users (user_id) values (?)').run(id);
	}

	updateToken(data) {
		return this.db.prepare('update users set access=:access, refresh=:refresh where user_id=:id').run(data);
	}

	getGarden(id) {
		return this.db.prepare('select * from garden where user_id = ?').get(id);
	}

	createGarden(id) {
		return this.db.prepare('insert into garden (user_id, amount) values (?, 0)').run(id);
	}

	updateGarden(data) {
		return this.db.prepare('update garden set amount=:amount where user_id=:id').run(data);
	}
}

const db = new DataClient();
await db.init();
export default db;