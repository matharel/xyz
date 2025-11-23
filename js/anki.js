// Used by genanki-js
var SQL;
initSqlJs().then(function(sql) {
	//Create the database
	SQL = sql;
});

window.addEventListener("load", () => {
	document.getElementById("anki-button").addEventListener("click", async (e) => {
		let text = e.target.innerText;
		e.target.innerText = "Generating deck";
		e.target.disabled = true;

		const m = new Model({
			name: "Basic",
			id: "1542906796044",
			flds: [
				{ name: "Front" },
				{ name: "Back" }
			],
			req: [
				[0, "all", [0]],
			],
			tmpls: [
				{
					name: "Card 1",
					qfmt: "{{Front}}",
					afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
				}
			],
		});

		const d = new Deck(1733843662437, "ankihugo");
		const p = new Package();

		for (let domcard of document.getElementsByClassName("anki")) {
			let card = domcard.cloneNode(true);
			let info = card.dataset.info.split(" ");
			let id = null;
			let tags = e.target.dataset.info.split(" ");
			for (let tag of info) {
				if (tag.substring(0, 3) === "id=") {
					id = tag;
				} else {
					tags.push(tag);
				}
				
			}

			// Get audio
			for (let audio of card.querySelectorAll("audio")) {
				let path = audio.getElementsByTagName("source")[0].src;
				let basename = path.split("/").reverse()[0];
				audio.outerHTML = "[sound:" + basename + "]"

				let blob = await fetch(path).then(res => {
					if (!res.ok) {
						return null;
					}
					return res.blob();
				});

				p.addMedia(blob, basename);
			}

			d.addNote(m.note([
				card.getElementsByClassName("question")[0].getHTML(),
				card.getElementsByClassName("answer")[0].getHTML(),
			], tags, id));
		}

		p.addDeck(d);
		p.writeToFile('ankihugo.apkg')

		e.target.innerText = text;
		e.target.disabled = false;
	});
});
