const google = require('googleapis');
const authentication = require('./auth');
const { spreadsheet } = require('./config');

const parsePeople = people =>
	people.values.map(([name, mail]) => ({
		name,
		mail
	}));

const timeRegex = /(\d+):(\d+)/;

const parseList = (date, list) => {
	date = new Date(date.values[0][0]);
	return list.values
		.filter(i => timeRegex.test(i[0]) && i[1])
		.map(([time, person]) => ({
			time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), ...timeRegex.exec(time).slice(1, 3)),
			person
		}));
};

function getData(auth) {
	return new Promise((resolve, reject) => {
		var sheets = google.sheets('v4');
		// obtener datos de la planilla
		sheets.spreadsheets.get({ auth, spreadsheetId: spreadsheet.id }, (err, response) => {
			if (err) {
				return reject(err);
			}

			const sheet = response.sheets.find(s => !s.properties.hidden).properties.title;
			const lists = spreadsheet.ranges.list.map(r => r.replace('[SHEET]', `'${sheet}'`));

			sheets.spreadsheets.values.batchGet(
				{ auth, spreadsheetId: spreadsheet.id, ranges: [spreadsheet.ranges.people, ...lists] },
				(err, { valueRanges: [people, date, list] }) => {
					if (err) {
						return reject(err);
					}
					return resolve({
						people: parsePeople(people),
						list: parseList(date, list)
					});
				}
			);
		});
	});
}

const getList = () => authentication.authenticate().then(auth => getData(auth));

module.exports = {
	getList
};
